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

function loadClient(extra = {}) {
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
  fmtMoney: fmtMoney, fmtNum: fmtNum, fmtQty: fmtQty, dec: dec, num: num, kToDong: kToDong,
  sanitize: sanitize, parseBackup: parseBackup, mergeCandidates: mergeCandidates,
  reconcileList: reconcileList, txCogs: txCogs, findProduct: findProduct,
  setDb: function(v){ db = v; },
  getDb: function(){ return db; },
  setDirty: function(v){ dirty = !!v; },
  isDirty: function(){ return dirty; },
  setBase: function(v){ cloudBase = dec(v); },
  getBase: function(){ return cloudBase; },
  saveLocal: saveLocal, readDirty: readDirty, readBase: readBase,
  computeStats: computeStats, allocateRemedyAmounts: allocateRemedyAmounts,
  balanceRemedyMoney: balanceRemedyMoney, allocateRemedyByCost: allocateRemedyByCost,
  remedyLineCost: remedyLineCost, applyRemedyBalance: applyRemedyBalance,
  remedyMates: remedyMates, scaledRemedyCost: scaledRemedyCost,
  backupBeforeRestore: backupBeforeRestore, downloadBackup: downloadBackup,
  pushState: pushState, pullState: pullState, cloudConflict: cloudConflict, discardUnsynced: discardUnsynced,
  autoRefresh: autoRefresh,
  setConflictOpen: function(v){ conflictOpen = !!v; },
  setSyncErrorShown: function(v){ syncErrorShown = !!v; },
  isSyncRejected: function(){ return syncRejected; },
  setSyncRejected: function(v){ syncRejected = !!v; },
  getSyncRetryDelay: function(){ return syncRetryDelay; },
  setSyncRetryDelay: function(v){ syncRetryDelay = v; },
  setSyncRetryTimer: function(v){ syncRetryTimer = v; },
  setDirtySince: function(v){ dirtySince = v; }
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
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    ...extra
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

test('fmtMoney hiện nghìn đồng và giữ tới từng đồng', () => {
  assert.equal(app.fmtMoney(0), '0');
  assert.equal(app.fmtMoney(135000), '135');
  assert.equal(app.fmtMoney(13500), '13,5');
  assert.equal(app.fmtMoney(400), '0,4');
  assert.equal(app.fmtMoney(1000000), '1.000');
  assert.equal(app.fmtMoney(15088170), '15.088,17');
  assert.equal(app.fmtMoney(-2500), '-2,5');
  assert.equal(app.kToDong(13.5), 13500);
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

test('computeStats tính đúng doanh thu và lãi ngày/tháng/năm', () => {
  const products = [
    { id: 'p1', name: 'A', stock: 10, costPrice: 100 },
    { id: 'p2', name: 'B', stock: 2, costPrice: 50 }
  ];
  const txs = [
    { id: 't1', date: '2026-03-15', type: 'BAN', productId: 'p1', qty: 2, total: 1000, cost: 300 },
    { id: 't2', date: '2026-03-02', type: 'BAN', productId: 'p2', qty: 1, total: 200 },
    { id: 't3', date: '2026-03-01', type: 'NHAP', productId: 'p1', qty: 5, total: 500 },
    { id: 't4', date: '2025-12-31', type: 'BAN', productId: 'p1', qty: 1, total: 100, cost: 40 },
    { id: 't5', date: '2026-03-15', type: 'BAN', productId: 'x', qty: 1, total: 50 }
  ];
  const s = app.computeStats(txs, products, '2026-03-15');
  assert.equal(s.dExp, 1050);      // t1 + t5
  assert.equal(s.dCogs, 300);      // t5 không có giá vốn và không có sản phẩm → 0
  assert.equal(s.mImp, 500);       // chỉ NHAP trong tháng
  assert.equal(s.mExp, 1250);
  assert.equal(s.mCogs, 350);      // 300 + 50 (fallback p2) + 0
  assert.equal(s.yExp, 1250);
  assert.equal(s.profitDay, 750);
  assert.equal(s.profitMonth, 900);
  assert.equal(s.stock, 12);

  const loss = app.computeStats(
    [{ date: '2026-03-15', type: 'BAN', productId: 'p1', qty: 1, total: 10, cost: 20 }],
    products, '2026-03-15'
  );
  assert.equal(loss.profitDay, -10);
  assert.equal(loss.profitMonth, -10);
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

test('allocateRemedyAmounts chia đủ tiền và dòng cuối nhận phần dư', () => {
  const three = app.allocateRemedyAmounts(100, [{ g: 1 }, { g: 1 }, { g: 1 }]);
  assert.equal(three.length, 3);
  assert.equal(app.dec(three.reduce((a, b) => a + b, 0)), 100);

  const uneven = app.allocateRemedyAmounts(800, [{ g: 3 }, { g: 5 }]);
  assert.deepEqual(uneven, [300, 500]);

  const odd = app.allocateRemedyAmounts(100.001, [{ g: 3 }, { g: 5 }, { g: 7 }, { g: 11 }]);
  assert.equal(app.dec(odd.reduce((a, b) => a + b, 0)), 100.001);

  assert.deepEqual(app.allocateRemedyAmounts(42.5, [{ g: 10 }]), [42.5]);
  assert.equal(app.dec(app.allocateRemedyAmounts(100, [{ g: 0 }, { g: 0 }]).reduce((a, b) => a + b, 0)), 100);
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

test('backupBeforeRestore lưu snapshot hiện tại với tên riêng', () => {
  let blobText = '';
  let downloadName = '';
  class CaptureBlob { constructor(parts){ blobText = String(parts[0]); } }
  const document = {
    readyState: 'loading',
    documentElement: makeEl(),
    body: makeEl(),
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() {
      const e = makeEl();
      e.click = function () { downloadName = this.download; };
      return e;
    },
    addEventListener() {}, removeEventListener() {}
  };
  const client = loadClient({ Blob: CaptureBlob, document });
  client.setDb({
    products: [{ id: 'p1', name: 'A', stock: 1, costPrice: 2 }],
    transactions: [], prescriptions: [], updatedAt: 7
  });
  assert.equal(client.backupBeforeRestore(), true);
  assert.match(downloadName, /^kho-backup-truoc-restore-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  const payload = JSON.parse(blobText);
  assert.equal(payload.data.products[0].name, 'A');
  assert.equal(payload.data.updatedAt, 7);
});

test('backupBeforeRestore trả false khi trình duyệt chặn tạo file', () => {
  class BlockedBlob { constructor(){ throw new Error('blocked'); } }
  const client = loadClient({ Blob: BlockedBlob });
  client.setDb({ products: [], transactions: [], prescriptions: [], updatedAt: 0 });
  assert.equal(client.backupBeforeRestore(), false);
});

test('pushState khi 409: chọn Lấy bản mới thì tải remote, không ép ghi đè', async () => {
  const calls = [];
  const remote = { products: [{ id: 'p1', name: 'Remote', stock: 2, costPrice: 2 }], transactions: [], prescriptions: [], updatedAt: 20 };
  const fetchStub = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    calls.push({ method, headers: opts.headers || {} });
    if (method === 'PUT') {
      return { status: 200, json: async () => ({ success: false, conflict: true, updatedAt: 20 }) };
    }
    return { status: 200, json: async () => ({ success: true, data: remote }) };
  };
  const client = loadClient({ fetch: fetchStub, confirm: () => true });
  client.setDb({ products: [{ id: 'p1', name: 'Local', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 10 });
  client.setBase(10);
  client.setDirty(true);
  await client.pushState(true, false);
  assert.equal(client.getDb().products[0].name, 'Remote');
  assert.equal(client.isDirty(), false);
  assert.equal(calls.filter(c => c.method === 'PUT').length, 1);
  assert.ok(!calls.some(c => c.headers['X-Force']));
});

test('pushState khi 409: chọn giữ bản máy này thì ghi đè bằng X-Force', async () => {
  const calls = [];
  const fetchStub = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    calls.push({ method, headers: opts.headers || {} });
    if (method === 'PUT') {
      if (opts.headers && opts.headers['X-Force'] === '1')
        return { status: 200, json: async () => ({ success: true, updatedAt: 30 }) };
      return { status: 200, json: async () => ({ success: false, conflict: true, updatedAt: 20 }) };
    }
    throw new Error('không được gọi GET trong trường hợp này');
  };
  const client = loadClient({ fetch: fetchStub, confirm: () => false });
  client.setDb({ products: [{ id: 'p1', name: 'Local', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 10 });
  client.setBase(10);
  client.setDirty(true);
  const ok = await client.pushState(true, false);
  assert.equal(ok, true);
  const puts = calls.filter(c => c.method === 'PUT');
  assert.equal(puts.length, 2);
  assert.equal(puts[1].headers['X-Force'], '1');
  assert.equal(client.getDb().products[0].name, 'Local');
  assert.equal(client.isDirty(), false);
  assert.equal(client.getBase(), 30);
});

test('pullState khi dirty không ghi đè local, đẩy bản local lên', async () => {
  const calls = [];
  const remote = { products: [{ id: 'p1', name: 'Remote', stock: 2, costPrice: 2 }], transactions: [], prescriptions: [], updatedAt: 20 };
  const fetchStub = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    calls.push(method);
    if (method === 'PUT')
      return { status: 200, json: async () => ({ success: true, updatedAt: 40 }) };
    return { status: 200, json: async () => ({ success: true, data: remote }) };
  };
  const client = loadClient({ fetch: fetchStub });
  client.setDb({ products: [{ id: 'p1', name: 'Local', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 10 });
  client.setBase(10);
  client.setDirty(true);
  await client.pullState(true, false);
  assert.equal(client.getDb().products[0].name, 'Local');
  assert.deepEqual(calls, ['GET', 'PUT']);
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

test('PUT /api/state trả 400 khi trùng khoá (không warn+skip)', async () => {
  // trùng tên sản phẩm (lowercase)
  {
    const d1 = fakeD1();
    const state = structuredClone(emptyState);
    state.products.push({ id: 'p1', name: 'A Giao', stock: 1, costPrice: 0 }, { id: 'p2', name: 'a giao', stock: 2, costPrice: 0 });
    const res = await worker.fetch(put(state, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: d1 });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).details.some(m => /trùng tên/i.test(m)));
    assert.equal(d1.writes.filter(w => w.sql.startsWith('INSERT INTO products')).length, 0);
  }
  // trùng id sản phẩm
  {
    const state = structuredClone(emptyState);
    state.products.push({ id: 'p1', name: 'A', stock: 1, costPrice: 0 }, { id: 'p1', name: 'B', stock: 1, costPrice: 0 });
    const res = await worker.fetch(put(state, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).details.some(m => /trùng id/i.test(m)));
  }
  // trùng id giao dịch
  {
    const state = structuredClone(emptyState);
    state.products.push({ id: 'p1', name: 'A', stock: 1, costPrice: 0 });
    state.transactions.push(
      { id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: 1, total: 1 },
      { id: 't1', date: '2026-01-01', type: 'BAN', productId: 'p1', qty: 1, price: 1, total: 1 }
    );
    const res = await worker.fetch(put(state, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).details.some(m => /trùng id giao dịch/i.test(m)));
  }
  // trùng id / tên đơn thuốc (case-sensitive) và vị lặp trong đơn
  {
    const base = () => {
      const s = structuredClone(emptyState);
      s.products.push({ id: 'p1', name: 'A', stock: 1, costPrice: 0 });
      return s;
    };
    let s = base();
    s.prescriptions.push({ id: 'r1', name: 'Đơn', items: [{ productId: 'p1', grams: 1 }], total: 1, thang: 1 },
                         { id: 'r1', name: 'Khác', items: [{ productId: 'p1', grams: 1 }], total: 1, thang: 1 });
    let res = await worker.fetch(put(s, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).details.some(m => /trùng id/i.test(m)));

    s = base();
    s.prescriptions.push({ id: 'r1', name: 'Đơn A', items: [{ productId: 'p1', grams: 1 }], total: 1, thang: 1 },
                         { id: 'r2', name: 'Đơn A', items: [{ productId: 'p1', grams: 1 }], total: 1, thang: 1 });
    res = await worker.fetch(put(s, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).details.some(m => /trùng tên đơn thuốc/i.test(m)));

    s = base();
    s.prescriptions.push({ id: 'r1', name: 'Đơn', items: [{ productId: 'p1', grams: 1 }, { productId: 'p1', grams: 2 }], total: 1, thang: 1 });
    res = await worker.fetch(put(s, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).details.some(m => /lặp/i.test(m)));
  }
});

test('PUT /api/state trả 409 khi thiết bị khác đã ghi (không có X-Force)', async () => {
  const d1 = fakeD1({ sourceUpdatedAt: 5000 });
  const res = await worker.fetch(put(emptyState, { 'X-Base-Updated': '1000' }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.conflict, true);
  assert.equal(d1.writes.length, 0);
});

test('PUT /api/state trả 400 khi JSON hỏng', async () => {
  const req = new Request('https://kho.test/api/state', {
    method: 'PUT',
    headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
    body: '{"products":'
  });
  const res = await worker.fetch(req, { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.error, /JSON/);
});

test('PUT /api/state cảnh báo productId không tồn tại nhưng vẫn ghi', async () => {
  const d1 = fakeD1();
  const state = structuredClone(emptyState);
  state.products.push({ id: 'p1', name: 'A', stock: 1, costPrice: 0 });
  state.transactions.push({ id: 't1', date: '2026-01-01', type: 'BAN', productId: 'ghost', qty: 1, price: 1, total: 1 });
  state.prescriptions.push({ id: 'r1', name: 'Đơn', items: [{ productId: 'ghost2', grams: 1 }], total: 1, thang: 1 });
  const res = await worker.fetch(put(state, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.warnings.some(w => w.includes('ghost')));
  assert.ok(body.warnings.some(w => w.includes('ghost2')));
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

test('GET /api/state trả data có moneyUnit dong', async () => {
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
  assert.equal(body.data.moneyUnit, 'dong');
});

test('GET /api/version trả updatedAt cho client polling nhẹ', async () => {
  const d1 = fakeD1({ sourceUpdatedAt: 123456 });
  const res = await worker.fetch(new Request('https://kho.test/api/version', {
    headers: { Authorization: 'Bearer test-token' }
  }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(Number(body.data.updatedAt), 123456);
  assert.ok(d1.sqls.some(sql => /FROM app_meta/.test(sql) && /source_updated_at/.test(sql)));
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

test('PUT /api/state: X-Base-Updated không phải số → 400', async () => {
  const res = await worker.fetch(put(emptyState, { 'X-Base-Updated': 'abc' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.error, /không hợp lệ/i);
});

test('PUT /api/state: thiếu X-Base-Updated (không X-Force) → 428', async () => {
  const d1 = fakeD1();
  const res = await worker.fetch(put(emptyState), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 428);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.error, /X-Base-Updated/);
  assert.equal(d1.writes.length, 0);
});

test('PUT /api/state: stockDrift — lệch tồn vẫn ghi (200) và trả stockDrift; khớp thì không có', async () => {
  const mismatch = structuredClone(emptyState);
  mismatch.products.push({ id: 'p1', name: 'Lệch', stock: 5, costPrice: 0 });
  mismatch.transactions.push({ id: 't1', date: '2026-01-01', type: 'NHAP', productId: 'p1', qty: 3, price: 1, total: 3 });
  let res = await worker.fetch(put(mismatch, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 200);
  let body = await res.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.stockDrift) && body.stockDrift.length === 1);
  assert.equal(body.stockDrift[0].id, 'p1');
  assert.equal(body.stockDrift[0].name, 'Lệch');
  assert.equal(body.stockDrift[0].stock, 5);
  assert.equal(body.stockDrift[0].calc, 3);

  const ok = structuredClone(emptyState);
  ok.products.push({ id: 'p1', name: 'Khớp', stock: 3, costPrice: 0 });
  ok.transactions.push({ id: 't1', date: '2026-01-01', type: 'NHAP', productId: 'p1', qty: 3, price: 1, total: 3 });
  res = await worker.fetch(put(ok, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: fakeD1() });
  assert.equal(res.status, 200);
  body = await res.json();
  assert.equal(body.stockDrift, undefined);
});

test('GET /api/state bỏ oname khi bằng oid', async () => {
  const d1 = fakeD1({
    results(sql) {
      if (sql.includes('FROM transactions')) {
        return [{ id: 't1', date: '2026-01-01', type: 'NHAP', productId: 'p1', qty: 1, price: 2, total: 2, cost: null, oid: 'IM_001', oname: 'IM_001', retail: 0, rx: 0 }];
      }
      return [];
    }
  });
  const res = await worker.fetch(new Request('https://kho.test/api/state', {
    headers: { Authorization: 'Bearer test-token' }
  }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.transactions[0].oid, 'IM_001');
  assert.equal(body.data.transactions[0].oname, undefined);
});

test('PUT /api/state giữ created_at gốc của products/transactions khi ghi lại', async () => {
  const OLD_P = 1700000000001;
  const OLD_T = 1700000000002;
  const d1 = fakeD1({
    results(sql) {
      if (sql.includes('created_at') && sql.includes('FROM products')) return [{ id: 'p1', created_at: OLD_P }];
      if (sql.includes('created_at') && sql.includes('FROM transactions')) return [{ id: 't1', created_at: OLD_T }];
      return [];
    }
  });
  const state = structuredClone(emptyState);
  state.products.push({ id: 'p1', name: 'A', stock: 5, costPrice: 10 });
  state.transactions.push({ id: 't1', date: '2026-01-01', type: 'NHAP', productId: 'p1', qty: 5, price: 10, total: 50 });
  const res = await worker.fetch(put(state, { 'X-Force': '1' }), { APP_TOKEN: 'test-token', DB: d1 });
  assert.equal(res.status, 200);
  const pInsert = d1.writes.find(w => w.sql.startsWith('INSERT INTO products'));
  const tInsert = d1.writes.find(w => w.sql.startsWith('INSERT INTO transactions'));
  assert.ok(pInsert && tInsert);
  // products: (id, name, stock, cost, created_at, updated_at)
  assert.equal(pInsert.args[4], OLD_P);
  assert.notEqual(pInsert.args[5], OLD_P); // updated_at = now
  // transactions: (... 16 cols ..., created_at) = 17 args, created_at last
  assert.equal(tInsert.args[16], OLD_T);
});

/* ------------------------------------------------------------------ */
/* Đơn thuốc chén: chia theo vốn, cân lãi, giữ vốn lịch sử           */
/* ------------------------------------------------------------------ */

test('allocateRemedyByCost: n dòng cùng vốn → cost + floor(lãi/n), dòng cuối nhận dư', () => {
  // 3 vị, mỗi vị vốn 100, grand 1000 → lãi 700, floor(700/3)=233, dư 1
  const out = app.allocateRemedyByCost(1000, [{ cost: 100 }, { cost: 100 }, { cost: 100 }]);
  assert.deepStrictEqual(out, [333, 333, 334]);
  assert.equal(out.reduce((a, b) => a + b, 0), 1000);
  // 2 vị cùng vốn, chia hết
  assert.deepStrictEqual(app.allocateRemedyByCost(600, [{ cost: 100 }, { cost: 100 }]), [300, 300]);
  const empty = app.allocateRemedyByCost(0, []);
  assert.ok(Array.isArray(empty));
  assert.equal(empty.length, 0);
});

test('balanceRemedyMoney: giá bán thấp hơn vốn → null; đủ vốn → tổng = grand, lãi chia đều, dòng cuối dư', () => {
  assert.equal(app.balanceRemedyMoney(250, [{ exactCost: 100 }, { exactCost: 200 }]), null);
  assert.equal(app.balanceRemedyMoney(299, [{ exactCost: 100 }, { exactCost: 200 }]), null);

  // 2 vị vốn 100/200, grand 1000 → tổng vốn 300, lãi 700, mỗi vị +350 lãi → 450/550
  const out = app.balanceRemedyMoney(1000, [{ exactCost: 100 }, { exactCost: 200 }]);
  assert.ok(out);
  assert.deepEqual(out.map(r => r.cost), [100, 200]);
  assert.deepEqual(out.map(r => r.total), [450, 550]);
  assert.equal(out.reduce((a, r) => a + r.total, 0), 1000);

  // lãi chia đều, dòng cuối nhận phần dư (lẻ)
  const odd = app.balanceRemedyMoney(1001, [{ exactCost: 100 }, { exactCost: 200 }, { exactCost: 300 }]);
  assert.ok(odd);
  assert.equal(odd.reduce((a, r) => a + r.total, 0), 1001);
  // floor((1001-600)/3)=133 → [233,333,435]
  assert.deepEqual(odd.map(r => r.total), [233, 333, 435]);
});

test('remedyLineCost / applyRemedyBalance: giữ vốn đã lưu; grand thấp hơn tổng vốn (thiếu) → false', () => {
  // dòng đã lưu cost → giữ nguyên cost khi cân
  const lines = [
    { cost: 100, qty: 0.01, productId: 'x' },
    { cost: 200, qty: 0.02, productId: 'x' }
  ];
  assert.equal(app.remedyLineCost(lines[0]), 100);
  assert.equal(app.remedyLineCost(lines[1]), 200);
  const ok = app.applyRemedyBalance(lines, 1000);
  assert.equal(ok, true);
  assert.equal(lines[0].cost, 100);
  assert.equal(lines[1].cost, 200);
  assert.equal(lines[0].total + lines[1].total, 1000);
  assert.deepEqual([lines[0].total, lines[1].total], [450, 550]);

  // grand thấp hơn tổng vốn → false, không đổi dòng
  const short = [
    { cost: 100, qty: 0.01, total: 111, price: 1 },
    { cost: 200, qty: 0.02, total: 222, price: 2 }
  ];
  const snap = short.map(l => ({ cost: l.cost, total: l.total, price: l.price }));
  assert.equal(app.applyRemedyBalance(short, 299), false);
  assert.deepEqual(short.map(l => ({ cost: l.cost, total: l.total, price: l.price })), snap);

  // thiếu (vốn > grand) → false
  assert.equal(app.applyRemedyBalance([{ cost: 50, qty: 1 }, { cost: 60, qty: 1 }], 100), false);
});

test('scaledRemedyCost: co giãn theo vốn lịch sử của dòng', () => {
  // prevCost/prevQty có → scale theo tỉ lệ qty mới
  const t = { qty: 2, cost: null, productId: 'x' };
  assert.equal(app.scaledRemedyCost(t, 4, 200), 100);
  // fallback giá nhập từ db khi thiếu prevCost/prevQty
  app.setDb({ products: [{ id: 'p1', name: 'A', stock: 1, costPrice: 50 }], transactions: [], prescriptions: [], updatedAt: 0 });
  assert.equal(app.scaledRemedyCost({ qty: 3, cost: null, productId: 'p1' }, 0, 0), 150);
});

/* ------------------------------------------------------------------ */
/* Đồng bộ: 428 từ chối (không retry) + bỏ thay đổi chưa gửi          */
/* ------------------------------------------------------------------ */

test('pushState nhận 428: 1 lần PUT, không retry, syncRejected bật', async () => {
  let puts = 0;
  const timers = [];
  const fetchStub = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    if (method === 'PUT') {
      puts++;
      return { status: 428, json: async () => ({ success: false, error: 'Thiếu X-Base-Updated' }) };
    }
    return { status: 200, json: async () => ({ success: true, data: { products: [], transactions: [], prescriptions: [], updatedAt: 1 } }) };
  };
  const client = loadClient({
    fetch: fetchStub,
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    clearTimeout() {}
  });
  client.setDb({ products: [{ id: 'p1', name: 'L', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 10 });
  client.setBase(10);
  client.setDirtySince(1);
  client.setDirty(true);
  const ok = await client.pushState(false, false);
  assert.equal(ok, false);
  assert.equal(puts, 1);
  assert.equal(client.isSyncRejected(), true);
  // 428 bị từ chối → không lên lịch retry
  assert.equal(timers.length, 0);
});

test('discardUnsynced: tải nháp kho-nhap-bi-tu-choi + lấy bản server → dirty xóa, syncRejected tắt', async () => {
  const calls = [];
  let downloadName = '';
  const remote = { products: [{ id: 'p1', name: 'Remote', stock: 2, costPrice: 2 }], transactions: [], prescriptions: [], updatedAt: 50 };
  const fetchStub = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    calls.push(method);
    return { status: 200, json: async () => ({ success: true, data: remote }) };
  };
  const document = {
    readyState: 'loading',
    documentElement: makeEl(),
    body: makeEl(),
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() {
      const e = makeEl();
      e.click = function () { downloadName = this.download; };
      return e;
    },
    addEventListener() {}, removeEventListener() {}
  };
  const client = loadClient({ fetch: fetchStub, confirm: () => true, document, Blob: class { constructor() {} } });
  client.setDb({ products: [{ id: 'p1', name: 'Local', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 10 });
  client.setDirty(true);
  client.setSyncRejected(true);
  const out = await client.discardUnsynced();
  assert.equal(out, true);
  assert.match(downloadName, /^kho-nhap-bi-tu-choi-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  assert.ok(calls.includes('GET'));
  assert.equal(client.isDirty(), false);
  assert.equal(client.isSyncRejected(), false);
  assert.equal(client.getDb().products[0].name, 'Remote');
});

test('pushState 5xx/network: lên lịch retry 4000ms; PUT thành công reset delay về 4000', async () => {
  const timers = [];
  let mode = '500';
  let puts = 0;
  const fetchStub = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    if (method === 'PUT') {
      puts++;
      if (mode === 'network') throw new Error('offline');
      if (mode === '500') return { status: 500, json: async () => ({ success: false, error: 'lỗi máy chủ' }) };
      return { status: 200, json: async () => ({ success: true, updatedAt: Date.now() }) };
    }
    return { status: 200, json: async () => ({ success: true, data: { products: [], transactions: [], prescriptions: [], updatedAt: 1 } }) };
  };
  const client = loadClient({
    fetch: fetchStub,
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    clearTimeout() {}
  });
  client.setDb({ products: [], transactions: [], prescriptions: [], updatedAt: 1 });
  client.setBase(0);
  client.setDirty(true);

  // 5xx → retry 4000ms
  await client.pushState(false, false);
  assert.equal(puts, 1);
  assert.ok(timers.some(t => t.ms === 4000), 'phải lên lịch retry 4000ms sau 5xx');
  assert.equal(client.isSyncRejected(), false);

  // network → cũng retry (dọn timer cũ để không chặn schedule mới)
  timers.length = 0;
  client.setSyncRetryTimer(null);
  mode = 'network';
  client.setSyncRetryDelay(4000);
  await client.pushState(false, false);
  assert.ok(timers.some(t => t.ms === 4000), 'phải lên lịch retry 4000ms sau lỗi mạng');

  // PUT thành công → reset về 4000
  timers.length = 0;
  mode = 'ok';
  client.setDirty(true);
  client.setSyncRetryDelay(16000);
  await client.pushState(false, false);
  assert.equal(client.getSyncRetryDelay(), 4000);
});

test('autoRefresh: gọi /api/version trước, chỉ khi có bản mới mới kéo /api/state', async () => {
  const calls = [];
  const fetchStub = async (url, opts = {}) => {
    calls.push(String(url));
    if (String(url).indexOf('/api/version') >= 0) {
      return { status: 200, json: async () => ({ success: true, data: { updatedAt: 5 } }) };
    }
    return { status: 200, json: async () => ({ success: true, data: { products: [], transactions: [], prescriptions: [], updatedAt: 5 } }) };
  };
  const client = loadClient({ fetch: fetchStub });
  client.setDb({ products: [], transactions: [], prescriptions: [], updatedAt: 10 });
  client.setBase(10);
  client.setDirty(false);
  client.setConflictOpen(false);
  const ok = await client.autoRefresh();
  assert.equal(ok, false);
  // chỉ /api/version được gọi (bản 5 không mới hơn cloudBase 10 → không kéo /api/state)
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes('/api/version'));
});
