/**
 * Test chạy trực tiếp server.js (bản local production) qua HTTP thật.
 *
 * worker.test.mjs chỉ kiểm tra logic client + worker.js Cloudflare cũ; file này
 * bảo đảm chính server đang vận hành cũng đúng: validate snapshot, conflict
 * 409, làm tròn tiền, và tự động sao lưu.
 *
 * Cách chạy: node --test (chạy mọi file tests trong thư mục tests).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8899;
const BASE = `http://127.0.0.1:${PORT}`;

let child;
let dataDir;

function waitForServer(timeoutMs = 15000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const r = await fetch(`${BASE}/api/state`);
        if (r.ok) return resolve();
      } catch (e) { /* chưa lên, thử lại */ }
      if (Date.now() - started > timeoutMs) return reject(new Error('server không khởi động kịp'));
      setTimeout(tick, 150);
    };
    tick();
  });
}

async function put(state, headers = {}) {
  const r = await fetch(`${BASE}/api/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(state)
  });
  let body = null;
  try { body = await r.json(); } catch (e) {}
  return { status: r.status, body };
}

async function getState() {
  const r = await fetch(`${BASE}/api/state`);
  return (await r.json()).data;
}

function emptyState(extra = {}) {
  return { products: [], transactions: [], prescriptions: [], updatedAt: 0, ...extra };
}

test.before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qlk-test-'));
  child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir },
    stdio: 'ignore'
  });
  await waitForServer();
});

test.after(() => {
  if (child) child.kill();
  if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
});

test('server.js: GET /api/state trả state rỗng ban đầu', async () => {
  const data = await getState();
  assert.equal(data.products.length, 0);
  assert.equal(data.transactions.length, 0);
  assert.equal(data.prescriptions.length, 0);
});

test('server.js: PUT hợp lệ ghi rồi GET đọc lại đúng', async () => {
  const state = emptyState({
    products: [{ id: 'P1', name: 'Cam thảo', stock: 10, costPrice: 50 }],
    transactions: [{ id: 'T1', date: '2026-11-06', type: 'NHAP', productId: 'P1', qty: 10, price: 50, total: 500, ts: 1 }]
  });
  const res = await put(state);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const data = await getState();
  assert.equal(data.products.length, 1);
  assert.equal(data.transactions.length, 1);
  assert.equal(data.transactions[0].total, 500);
});

test('server.js: làm tròn tiền về số nguyên khi lưu', async () => {
  const state = emptyState({
    products: [{ id: 'P1', name: 'A', stock: 1, costPrice: 42.6 }],
    transactions: [{ id: 'T1', date: '2026-11-06', type: 'BAN', productId: 'P1', qty: 1, price: 42.4, total: 99.5, cost: 10.49, ts: 1 }]
  });
  const res = await put(state, { 'X-Force': '1' });
  assert.equal(res.status, 200);
  const data = await getState();
  assert.equal(data.products[0].costPrice, 43);      // 42.6 -> 43
  assert.equal(data.transactions[0].price, 42);      // 42.4 -> 42
  assert.equal(data.transactions[0].total, 100);     // 99.5 -> 100
  assert.equal(data.transactions[0].cost, 10);       // 10.49 -> 10
});

test('server.js: PUT dữ liệu âm bị chặn 400', async () => {
  const bad = emptyState({ products: [{ id: 'P1', name: 'X', stock: -1, costPrice: 0 }] });
  const res = await put(bad);
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(Array.isArray(res.body.details) && res.body.details.length > 0);
});

test('server.js: JSON hỏng trả 400', async () => {
  const r = await fetch(`${BASE}/api/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: '{khong phai json'
  });
  assert.equal(r.status, 400);
});

test('server.js: X-Base-Updated cũ trả 409 conflict', async () => {
  // Ghi lần 1 để có updatedAt hiện tại
  const first = await put(emptyState({
    products: [{ id: 'P1', name: 'A', stock: 1, costPrice: 1 }]
  }), { 'X-Force': '1' });
  assert.equal(first.status, 200);
  const currentUpdatedAt = first.body.updatedAt;

  // Gửi với base cũ (0) -> phải conflict
  const stale = await put(emptyState({
    products: [{ id: 'P2', name: 'B', stock: 2, costPrice: 2 }]
  }), { 'X-Base-Updated': '0' });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.conflict, true);
  assert.equal(stale.body.updatedAt, currentUpdatedAt);
});

test('server.js: X-Base-Updated không phải số bị từ chối (vá lỗi NaN)', async () => {
  const res = await put(emptyState({
    products: [{ id: 'P1', name: 'A', stock: 1, costPrice: 1 }]
  }), { 'X-Base-Updated': 'abc' });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('server.js: X-Force ghi đè dù base cũ', async () => {
  await put(emptyState({ products: [{ id: 'P1', name: 'A', stock: 1, costPrice: 1 }] }), { 'X-Force': '1' });
  const res = await put(emptyState({
    products: [{ id: 'P2', name: 'B', stock: 2, costPrice: 2 }]
  }), { 'X-Base-Updated': '0', 'X-Force': '1' });
  assert.equal(res.status, 200);
  const data = await getState();
  assert.equal(data.products[0].id, 'P2');
});

test('server.js: tự động tạo backup sau khi ghi dữ liệu', async () => {
  await put(emptyState({
    products: [{ id: 'P1', name: 'A', stock: 1, costPrice: 1 }],
    transactions: [{ id: 'T1', date: '2026-11-06', type: 'BAN', productId: 'P1', qty: 1, price: 1, total: 1, ts: 1 }]
  }), { 'X-Force': '1' });

  const backupDir = path.join(dataDir, 'backups');
  assert.ok(fs.existsSync(backupDir), 'thư mục backups phải tồn tại');
  const files = fs.readdirSync(backupDir).filter(n => /^backup-\d{4}-\d{2}-\d{2}\.db$/.test(n));
  assert.ok(files.length >= 1, 'phải có ít nhất 1 file backup');

  const r = await fetch(`${BASE}/api/backups`);
  const body = await r.json();
  assert.equal(body.success, true);
  assert.ok(body.count >= 1);
});

test('server.js: trang GET / dựng HTML, hết placeholder', async () => {
  const r = await fetch(`${BASE}/`);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.ok(!html.includes('%%NONCE%%'));
  assert.ok(!html.includes('%%BOOT%%'));
  assert.ok(!html.includes('%%NEEDFETCH%%'));
  assert.ok(!html.includes('/logout'), 'nút đăng xuất phải đã bị gỡ');
});
