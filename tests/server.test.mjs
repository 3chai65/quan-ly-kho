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

test('server.js: giữ created_at gốc khi ghi lại (không đặt lại)', async () => {
  // Ghi lần 1
  await put(emptyState({
    products: [{ id: 'KEEP1', name: 'GiuNgay', stock: 1, costPrice: 1 }],
    transactions: [{ id: 'KTX1', date: '2026-11-06', type: 'NHAP', productId: 'KEEP1', qty: 1, price: 1, total: 1, ts: 1 }]
  }), { 'X-Force': '1' });

  const DB = (await import('better-sqlite3')).default;
  const dbPath = path.join(dataDir, 'app.db');
  const readCreated = () => {
    const conn = new DB(dbPath, { readonly: true });
    const p = conn.prepare('SELECT created_at FROM products WHERE id = ?').get('KEEP1');
    const t = conn.prepare('SELECT created_at FROM transactions WHERE id = ?').get('KTX1');
    conn.close();
    return { p: p && p.created_at, t: t && t.created_at };
  };

  const first = readCreated();
  assert.ok(first.p > 0 && first.t > 0, 'phải có created_at sau lần ghi đầu');

  // Đợi để mốc thời gian khác, rồi ghi lại cùng id
  await new Promise(r => setTimeout(r, 30));
  await put(emptyState({
    products: [{ id: 'KEEP1', name: 'GiuNgay', stock: 5, costPrice: 2 }],
    transactions: [{ id: 'KTX1', date: '2026-11-06', type: 'NHAP', productId: 'KEEP1', qty: 5, price: 2, total: 10, ts: 1 }]
  }), { 'X-Force': '1' });

  const second = readCreated();
  assert.equal(second.p, first.p, 'created_at của product phải giữ nguyên');
  assert.equal(second.t, first.t, 'created_at của transaction phải giữ nguyên');
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
test('server.js: orderName không fallback thành oid; tự dọn oname === oid khi đọc', async () => {
  await put(emptyState({
    products: [{ id: 'P1', name: 'A', stock: 10, costPrice: 1 }],
    transactions: [
      { id: 'T_IMP1', date: '2026-11-06', type: 'NHAP', productId: 'P1', qty: 10, price: 1, total: 10, oid: 'IM_001', ts: 1 },
      { id: 'T_BAN1', date: '2026-11-06', type: 'BAN', productId: 'P1', qty: 1, price: 2, total: 2, oid: 'ORD_001', oname: 'Bán lẻ', ts: 2 }
    ]
  }), { 'X-Force': '1' });

  const data = await getState();
  const imp = data.transactions.find(t => t.id === 'T_IMP1');
  const ban = data.transactions.find(t => t.id === 'T_BAN1');

  assert.equal(imp.oid, 'IM_001');
  assert.equal(imp.oname, undefined, 'đơn nhập không có oname thì không được fallback thành oid');
  assert.equal(ban.oid, 'ORD_001');
  assert.equal(ban.oname, 'Bán lẻ');

  const DB = (await import('better-sqlite3')).default;
  const dbPath = path.join(dataDir, 'app.db');
  const conn = new DB(dbPath);
  conn.prepare("UPDATE transactions SET order_name = 'IM_001' WHERE id = 'T_IMP1'").run();
  conn.close();

  const refreshed = await getState();
  const impRefreshed = refreshed.transactions.find(t => t.id === 'T_IMP1');
  assert.equal(impRefreshed.oname, undefined, 'readState phải tự dọn bỏ oname khi trùng với oid');
});

test('server.js: tiền lẻ còn trong DB được đọc thành số nguyên', async () => {
  await put(emptyState({
    products: [{ id: 'PLEG', name: 'TienLe', stock: 1, costPrice: 10 }],
    transactions: [{ id: 'TLEG', date: '2026-11-06', type: 'BAN', productId: 'PLEG', qty: 1, price: 10, total: 10, cost: 4, unitPrice: 8, ts: 1 }],
    prescriptions: [{ id: 'RLEG', name: 'Don le', items: [{ productId: 'PLEG', grams: 5 }], total: 8, thang: 1 }]
  }), { 'X-Force': '1' });

  const DB = (await import('better-sqlite3')).default;
  const conn = new DB(path.join(dataDir, 'app.db'));
  conn.prepare('UPDATE products SET cost_price_vnd = 42.6 WHERE id = ?').run('PLEG');
  conn.prepare('UPDATE transactions SET price_vnd = 42.4, total_vnd = 99.5, cost_vnd = 10.49, unit_price_vnd = 8.5 WHERE id = ?').run('TLEG');
  conn.prepare('UPDATE prescriptions SET total_vnd = 12.6 WHERE id = ?').run('RLEG');
  conn.close();

  const data = await getState();
  const p = data.products.find(x => x.id === 'PLEG');
  const t = data.transactions.find(x => x.id === 'TLEG');
  const r = data.prescriptions.find(x => x.id === 'RLEG');
  assert.equal(p.costPrice, 43);
  assert.equal(t.price, 42);
  assert.equal(t.total, 100);
  assert.equal(t.cost, 10);
  assert.equal(t.unitPrice, 9);
  assert.equal(r.total, 13);
});

test('server.js: payload quá lớn trả JSON 413', async () => {
  const largeState = emptyState({
    products: Array.from({ length: 60000 }, (_, i) => ({
      id: 'P' + i,
      name: 'Thuoc ' + i,
      stock: 1,
      costPrice: 10
    }))
  });
  const bodyStr = JSON.stringify(largeState);
  if (bodyStr.length > 4 * 1024 * 1024) {
    const r = await fetch(`${BASE}/api/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    });
    assert.equal(r.status, 413);
    const json = await r.json();
    assert.equal(json.success, false);
    assert.equal(json.error, 'Payload too large');
  }
});
