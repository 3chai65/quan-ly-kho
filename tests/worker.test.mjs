import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { PAGE } from '../src/page.js';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ */
/* Nạp phần JS chạy trên trình duyệt từ src/page.js vào sandbox vm.    */
/* ------------------------------------------------------------------ */

function makeEl() {
  return {
    style: {}, dataset: {}, children: [],
    value: '', textContent: '', hidden: false, checked: false, disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    hasAttribute() { return false; }, appendChild(child) { this.children.push(child); return child; },
    remove() {}, focus() {}, select() {}, click() {},
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    dispatchEvent() { return true; }, scrollIntoView() {}
  };
}

function loadClient() {
  const blocks = [...PAGE.matchAll(/<script nonce="%%NONCE%%">([\s\S]*?)<\/script>/g)]
    .map(m => m[1]);
  const code = blocks.find(b => b.includes('var doc = document;'));
  if (!code) throw new Error('Không tìm thấy script chính trong src/page.js');

  let js = code
    .replace(/%%BOOT%%/g, 'null')
    .replace(/%%NEEDFETCH%%/g, 'false');

  const end = js.lastIndexOf('})();');
  if (end === -1) throw new Error('Không tìm thấy điểm kết thúc IIFE');
  js = js.slice(0, end) + `
globalThis.__test = {
  fmtMoney: fmtMoney, fmtNum: fmtNum, fmtQty: fmtQty, dec: dec, num: num,
  sanitize: sanitize, parseBackup: parseBackup, mergeCandidates: mergeCandidates,
  reconcileList: reconcileList, txCogs: txCogs, findProduct: findProduct,
  setDb: function(v){ db = v; },
  getDb: function(){ return db; },
  setDirty: function(v){ dirty = !!v; },
  isDirty: function(){ return dirty; },
  setBase: function(v){ cloudBase = dec(v); },
  getBase: function(){ return cloudBase; },
  saveLocal: saveLocal, readDirty: readDirty, readBase: readBase
};
})();`;
  const store = new Map();
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
  const document = {
    readyState: 'loading',
    documentElement: makeEl(),
    body: makeEl(),
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return makeEl(); },
    createElementNS() { return makeEl(); },
    addEventListener() {}, removeEventListener() {}
  };
  const sandbox = {
    console, Intl, Date, Math, JSON, Number, String, Array, Object,
    parseFloat, isFinite, NaN, Infinity, Map, Set, Promise,
    setTimeout() { return 0; }, clearTimeout() {},
    localStorage, document,
    navigator: {}, location: { href: 'https://example.test/' },
    crypto: { randomUUID: () => '00000000-0000-4000-8000-' + String(Math.random()).slice(2, 14) },
    confirm: () => true, alert() {},
    addEventListener() {}, removeEventListener() {},
    innerWidth: 1024, innerHeight: 768, scrollY: 0, scrollX: 0, devicePixelRatio: 1,
    requestAnimationFrame() { return 0; }, cancelAnimationFrame() {},
    getComputedStyle() { return { getPropertyValue() { return ''; } }; },
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    Blob: class {}, FileReader: class {}, MouseEvent: class {},
    matchMedia: () => ({ matches: false, addEventListener() {} })
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { filename: 'worker-client.js' });
  return sandbox.__test;
}

const app = loadClient();

test('src/page.js giữ nguyên placeholder CSP/SSR của trang', () => {
  assert.ok(PAGE.includes('<script nonce="%%NONCE%%">'));
  assert.ok(PAGE.includes('window.__DB__=%%BOOT%%;'));
  assert.ok(PAGE.includes('window.__NEED_FETCH__=%%NEEDFETCH%%;'));
  assert.ok(PAGE.trimEnd().endsWith('</html>'));
});

/* ------------------------------------------------------------------ */
/* Hàm thuần: tiền, số lượng, chuẩn hoá dữ liệu                        */
/* ------------------------------------------------------------------ */

test('fmtMoney hiển thị đúng giá trị đã lưu, không cắt lẻ', () => {
  assert.equal(app.fmtMoney(42.5), '42,5');
  assert.equal(app.fmtMoney(0), '0');
  assert.equal(app.fmtMoney(1000), '1.000');
  assert.equal(app.fmtMoney(-2.5), '-2,5');
  assert.equal(app.fmtNum(0.1 + 0.2), '0,3');
});

test('fmtQty đổi kg → lạng → g', () => {
  assert.equal(app.fmtQty(0), '0g');
  assert.equal(app.fmtQty(0.2), '2 lạng');
  assert.equal(app.fmtQty(0.005), '5 g');
  assert.equal(app.fmtQty(1.5), '1,5 kg');
});

test('sanitize loại bản ghi trùng id/tên để không làm hỏng batch ghi', () => {
  const out = app.sanitize({
    products: [
      { id: 'p1', name: 'A Giao', stock: 1, costPrice: 10 },
      { id: 'p2', name: 'a giao', stock: 2, costPrice: 20 },
      { id: 'p1', name: 'Khác', stock: 3, costPrice: 30 }
    ],
    transactions: [
      { id: 't1', date: '2026-01-01', type: 'NHAP', productId: 'p1', qty: 1, price: 10, total: 10 },
      { id: 't1', date: '2026-01-02', type: 'BAN', productId: 'p1', qty: 1, price: 10, total: 10 }
    ],
    prescriptions: [
      { id: 'r1', name: 'Đơn A', items: [{ productId: 'p1', grams: 5 }, { productId: 'p1', grams: 6 }] },
      { id: 'r2', name: 'Đơn A', items: [{ productId: 'p1', grams: 7 }] },
      { id: 'r3', name: 'đơn a', items: [{ productId: 'p1', grams: 8 }] }
    ]
  });
  assert.equal(out.products.length, 1);
  assert.equal(out.products[0].id, 'p1');
  assert.equal(out.transactions.length, 1);
  /* Tên đơn trong DB phân biệt hoa/thường: "Đơn A" và "đơn a" đều được giữ. */
  assert.equal(out.prescriptions.length, 2);
  assert.equal(out.prescriptions[0].items.length, 1);
  assert.ok(out.prescriptions.some(r => r.name === 'đơn a'));
});

test('parseBackup chỉ nhận file đủ 3 bảng và số liệu hợp lệ', () => {
  const valid = {
    app: 'quan-ly-kho', version: 1,
    data: { products: [{ id: 'p1', name: 'A', stock: 1, costPrice: 2 }], transactions: [], prescriptions: [] }
  };
  assert.ok(app.parseBackup(JSON.stringify(valid)));

  assert.equal(app.parseBackup(JSON.stringify({ data: { products: [] } })), null);
  assert.equal(app.parseBackup(JSON.stringify({ data: { products: [], transactions: [], prescriptions: [] }, app: 'khac' })), null);

  const negativeStock = structuredClone(valid);
  negativeStock.data.products[0].stock = -1;
  assert.equal(app.parseBackup(JSON.stringify(negativeStock)), null);

  const negativeMoney = structuredClone(valid);
  negativeMoney.data.transactions.push({ id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: -1, total: -1 });
  assert.equal(app.parseBackup(JSON.stringify(negativeMoney)), null);

  const badDate = structuredClone(valid);
  badDate.data.transactions.push({ id: 't1', date: '01/01/2026', type: 'NHAP', productId: 'p1', qty: 1, price: 1, total: 1 });
  assert.equal(app.parseBackup(JSON.stringify(badDate)), null);
});

/* ------------------------------------------------------------------ */
/* Nghiệp vụ kho: đối chiếu, giá vốn, gộp đơn                          */
/* ------------------------------------------------------------------ */

test('txCogs dùng giá vốn đã lưu, fallback giá hiện tại khi thiếu', () => {
  app.setDb({
    products: [{ id: 'p1', name: 'A', stock: 5, costPrice: 99 }],
    transactions: [], prescriptions: [], updatedAt: 0
  });
  assert.equal(app.txCogs({ productId: 'p1', qty: 2, cost: 20 }), 20);
  assert.equal(app.txCogs({ productId: 'p1', qty: 2, cost: null }), 198);
  assert.equal(app.txCogs({ productId: 'x', qty: 2 }), 0);
});

test('reconcileList tính đúng chênh lệch và phát hiện tồn lịch sử âm', () => {
  app.setDb({
    products: [
      { id: 'p1', name: 'A', stock: 1, costPrice: 0 },
      { id: 'p2', name: 'B', stock: 5, costPrice: 0 }
    ],
    transactions: [
      { id: 't1', date: '2026-01-01', type: 'NHAP', productId: 'p1', qty: 10, price: 1, total: 10 },
      { id: 't2', date: '2026-01-02', type: 'BAN', productId: 'p1', qty: 18, price: 1, total: 18 },
      { id: 't3', date: '2026-01-01', type: 'NHAP', productId: 'p2', qty: 5, price: 1, total: 5 }
    ],
    prescriptions: [], updatedAt: 0
  });
  const list = app.reconcileList();
  const p1 = list.find(r => r.id === 'p1');
  assert.ok(p1);
  assert.equal(p1.calc, -8);
  assert.equal(p1.diff, 9);
  assert.equal(list.find(r => r.id === 'p2'), undefined);
});

test('mergeCandidates bỏ qua giao dịch bán lẻ, kể cả dữ liệu cũ', () => {
  app.setDb({
    products: [],
    transactions: [
      { id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: 100, total: 100, retail: true },
      { id: 't2', date: '2026-01-01', type: 'BAN', productId: 'p2', qty: 1, price: 100, total: 100 },
      { id: 't3', date: '2026-01-02', type: 'BAN', productId: 'p3', qty: 1, price: 200, total: 200, oname: 'Bán lẻ' },
      { id: 't4', date: '2026-01-02', type: 'BAN', productId: 'p4', qty: 1, price: 200, total: 200 }
    ],
    prescriptions: [], updatedAt: 0
  });
  assert.equal(app.mergeCandidates().length, 0);
});

test('mergeCandidates vẫn gộp các dòng bán rời không có cờ retail', () => {
  app.setDb({
    products: [],
    transactions: [
      { id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: 100, total: 100 },
      { id: 't2', date: '2026-01-01', type: 'BAN', productId: 'p2', qty: 1, price: 100, total: 100 }
    ],
    prescriptions: [], updatedAt: 0
  });
  const list = app.mergeCandidates();
  assert.equal(list.length, 1);
  assert.equal(list[0].items.length, 2);
});

/* ------------------------------------------------------------------ */
/* Trạng thái đồng bộ local                                            */
/* ------------------------------------------------------------------ */

test('saveLocal lưu đúng cờ dirty và mốc cloud base', () => {
  app.setDb({ products: [], transactions: [], prescriptions: [], updatedAt: 1 });
  app.setDirty(false);
  app.setBase(123);
  app.saveLocal();
  assert.equal(app.readDirty(), false);
  assert.equal(app.readBase(), 123);

  app.setDirty(true);
  app.saveLocal();
  assert.equal(app.readDirty(), true);
});

/* ------------------------------------------------------------------ */
/* API Worker: validate snapshot trước khi ghi                         */
/* ------------------------------------------------------------------ */

const worker = (await import('../worker.js')).default;

function fakeD1(opts = {}) {
  const writes = [];
  const sqls = [];
  const db = {
    writes,
    sqls,
    prepare(sql) {
      sqls.push(sql);
      const stmt = {
        bind(...args) { writes.push({ sql, args }); return stmt; },
        async first() { return opts.sourceUpdatedAt != null ? { value: String(opts.sourceUpdatedAt) } : { value: '0' }; },
        async all() { return { results: opts.results ? opts.results(sql) : [] }; }
      };
      return stmt;
    },
    async batch(list) { return list.map(() => ({ success: true })); }
  };
  return db;
}

function put(state, extraHeaders = {}) {
  return new Request('https://kho.test/api/state', {
    method: 'PUT',
    headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(state)
  });
}

const emptyState = { products: [], transactions: [], prescriptions: [], updatedAt: 0 };

test('GET / lắp PAGE từ src/page.js và thay đủ placeholder', async () => {
  const d1 = fakeD1();
  const res = await worker.fetch(new Request('https://kho.test/', {
    headers: { Authorization: 'Bearer test-token' }
  }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('window.__DB__={'));
  assert.ok(html.includes('window.__NEED_FETCH__=false;'));
  assert.ok(!html.includes('%%NONCE%%'));
  assert.ok(!html.includes('%%BOOT%%'));
  assert.ok(!html.includes('%%NEEDFETCH%%'));
  const nonce = res.headers.get('Content-Security-Policy').match(/nonce-([a-f0-9]+)/)[1];
  assert.ok(html.includes('<script nonce="' + nonce + '">'));
  assert.ok(html.includes('<style nonce="' + nonce + '">'));
});

test('PUT /api/state chặn tồn kho âm', async () => {
  const state = structuredClone(emptyState);
  state.products.push({ id: 'p1', name: 'A', stock: -1, costPrice: 0 });
  const res = await worker.fetch(put(state), { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.details.join(' '), /tồn kho/i);
});

test('PUT /api/state chặn tiền âm, ngày sai và thiếu bảng', async () => {
  const neg = structuredClone(emptyState);
  neg.products.push({ id: 'p1', name: 'A', stock: 1, costPrice: 0 });
  neg.transactions.push({ id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: 10, total: -10 });
  let res = await worker.fetch(put(neg), { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 400);
  assert.match((await res.json()).details.join(' '), /thành tiền/i);

  const badDate = structuredClone(emptyState);
  badDate.transactions.push({ id: 't1', date: '01/01/2026', type: 'NHAP', productId: 'p1', qty: 1, price: 1, total: 1 });
  res = await worker.fetch(put(badDate), { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 400);
  assert.match((await res.json()).details.join(' '), /YYYY-MM-DD/);

  res = await worker.fetch(put({ products: [] }), { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 400);
  assert.match((await res.json()).details.join(' '), /Thiếu mảng/i);
});

test('PUT /api/state tự loại bản ghi trùng thay vì làm hỏng batch', async () => {
  const d1 = fakeD1();
  const state = structuredClone(emptyState);
  state.products.push(
    { id: 'p1', name: 'A Giao', stock: 1, costPrice: 0 },
    { id: 'p2', name: 'a giao', stock: 2, costPrice: 0 }
  );
  state.prescriptions.push(
    { id: 'r1', name: 'Đơn A', items: [{ productId: 'p1', grams: 5 }, { productId: 'p1', grams: 6 }], total: 10, thang: 1 }
  );
  const res = await worker.fetch(put(state), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.warnings) && body.warnings.length >= 2);
  const productInserts = d1.writes.filter(w => w.sql.startsWith('INSERT INTO products'));
  assert.equal(productInserts.length, 1);
  const itemInserts = d1.writes.filter(w => w.sql.startsWith('INSERT INTO prescription_items'));
  assert.equal(itemInserts.length, 1);
});

test('PUT /api/state trả 409 khi thiết bị khác đã ghi (không có X-Force)', async () => {
  const d1 = fakeD1({ sourceUpdatedAt: 5000 });
  const res = await worker.fetch(put(emptyState, { 'X-Base-Updated': '1000' }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.conflict, true);
  assert.equal(d1.writes.length, 0);
});

test('PUT /api/state cho phép ghi đè khi có X-Force', async () => {
  const d1 = fakeD1({ sourceUpdatedAt: 5000 });
  const res = await worker.fetch(put(emptyState, { 'X-Base-Updated': '1000', 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).success, true);
});

test('GET /api/state đọc giao dịch và dòng đơn theo rowid', async () => {
  const d1 = fakeD1({
    results(sql) {
      if (sql.includes('FROM transactions')) {
        return [{ id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: 2, total: 2, cost: null, retail: 0, rx: 0 }];
      }
      return [];
    }
  });
  const res = await worker.fetch(new Request('https://kho.test/api/state', {
    headers: { Authorization: 'Bearer test-token' }
  }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.transactions.length, 1);
  assert.equal(body.data.transactions[0].cost, undefined);
  assert.ok(d1.sqls.some(sql => sql.includes('FROM transactions') && /rowid ASC/.test(sql)));
  assert.ok(d1.sqls.some(sql => sql.includes('FROM prescription_items') && /rowid ASC/.test(sql)));
});

/* ------------------------------------------------------------------ */
/* Script chuyển backup JSON sang SQL                                  */
/* ------------------------------------------------------------------ */

test('backup-to-sql giữ NULL cho cost thay vì biến thành 0', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kho-backup-test-'));
  const file = path.join(dir, 'backup.json');
  fs.writeFileSync(file, JSON.stringify({
    app: 'quan-ly-kho',
    data: {
      products: [{ id: 'p1', name: 'A', stock: 1, costPrice: 2 }],
      transactions: [{ id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: 100, total: 100, cost: null }],
      prescriptions: []
    }
  }), 'utf8');
  const { stdout } = await run(process.execPath, [path.join(root, 'scripts/backup-to-sql.mjs'), file], { cwd: root });
  const txLine = stdout.split('\n').find(line => line.includes('INSERT INTO transactions'));
  assert.ok(txLine, 'phải sinh câu INSERT transactions');
  assert.match(txLine, /100, NULL, NULL, NULL/);
  fs.rmSync(dir, { recursive: true, force: true });
});
