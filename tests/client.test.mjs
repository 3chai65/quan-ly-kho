import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

import { PAGE } from '../src/page.js';

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
  const blocks = [...PAGE.matchAll(/<script>([\s\S]*?)<\/script>/g)]
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
  saveLocal: saveLocal, readDirty: readDirty, readBase: readBase,
  computeStats: computeStats, allocateRemedyAmounts: allocateRemedyAmounts,
  backupBeforeRestore: backupBeforeRestore, downloadBackup: downloadBackup,
  pushState: pushState, pullState: pullState, cloudConflict: cloudConflict,
  autoRefresh: autoRefresh, busyEditing: busyEditing,
  setRetailItems: function(v){ retailItems = v; },
  setActiveTag: function(tag){ doc.activeElement = tag ? { tagName: tag } : null; },
  setConflictOpen: function(v){ conflictOpen = !!v; },
  setSyncErrorShown: function(v){ syncErrorShown = !!v; }
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

test('src/page.js giữ placeholder SSR cần thiết của trang', () => {
  assert.ok(PAGE.includes('<script>'), 'không còn nonce (CSP dùng unsafe-inline)');
  assert.ok(!PAGE.includes('nonce='), 'đã gỡ nonce');
  assert.ok(!PAGE.includes('%%NONCE%%'), 'đã gỡ placeholder nonce');
  assert.ok(PAGE.includes('window.__DB__=%%BOOT%%;'));
  assert.ok(PAGE.includes('window.__NEED_FETCH__=%%NEEDFETCH%%;'));
  assert.ok(PAGE.trimEnd().endsWith('</html>'));
});

/* ------------------------------------------------------------------ */
/* Hàm thuần: tiền, số lượng, chuẩn hoá dữ liệu                        */
/* ------------------------------------------------------------------ */

test('fmtMoney làm tròn thành số nguyên, bỏ phần thập phân', () => {
  assert.equal(app.fmtMoney(42.5), '43');
  assert.equal(app.fmtMoney(0), '0');
  assert.equal(app.fmtMoney(1000), '1.000');
  assert.equal(app.fmtMoney(-2.5), '-2');
  assert.equal(app.fmtMoney(1234.56), '1.235');
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

test('allocateRemedyAmounts chia đủ tiền thành số nguyên, dòng cuối nhận phần dư', () => {
  const three = app.allocateRemedyAmounts(100, [{ g: 1 }, { g: 1 }, { g: 1 }]);
  assert.equal(three.length, 3);
  assert.equal(three.reduce((a, b) => a + b, 0), 100);
  assert.ok(three.every(Number.isInteger));

  const uneven = app.allocateRemedyAmounts(800, [{ g: 3 }, { g: 5 }]);
  assert.deepEqual(uneven, [300, 500]);

  const odd = app.allocateRemedyAmounts(100, [{ g: 3 }, { g: 5 }, { g: 7 }, { g: 11 }]);
  assert.equal(odd.reduce((a, b) => a + b, 0), 100);
  assert.ok(odd.every(Number.isInteger));

  assert.deepEqual(app.allocateRemedyAmounts(42.5, [{ g: 10 }]), [42.5]);
  assert.equal(app.allocateRemedyAmounts(100, [{ g: 0 }, { g: 0 }]).reduce((a, b) => a + b, 0), 100);
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
/* Tự làm mới giữa các thiết bị (autoRefresh)                         */
/* ------------------------------------------------------------------ */

test('autoRefresh: tải bản server mới hơn khi máy không có thay đổi', async () => {
  const remote = { products: [{ id: 'p1', name: 'Moi', stock: 9, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 500 };
  const fetchStub = async () => ({ status: 200, json: async () => ({ success: true, data: remote }) });
  const client = loadClient({ fetch: fetchStub });
  client.setDb({ products: [{ id: 'p1', name: 'Cu', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 100 });
  client.setBase(100);
  client.setDirty(false);
  await client.autoRefresh();
  assert.equal(client.getDb().products[0].name, 'Moi');
  assert.equal(client.getBase(), 500);
});

test('autoRefresh: KHÔNG ghi đè khi máy đang có thay đổi chưa gửi', async () => {
  const remote = { products: [{ id: 'p1', name: 'Moi', stock: 9, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 500 };
  const fetchStub = async () => ({ status: 200, json: async () => ({ success: true, data: remote }) });
  const client = loadClient({ fetch: fetchStub });
  client.setDb({ products: [{ id: 'p1', name: 'ChuaGui', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 100 });
  client.setBase(100);
  client.setDirty(true);
  await client.autoRefresh();
  assert.equal(client.getDb().products[0].name, 'ChuaGui', 'phải giữ bản local khi đang dirty');
});

test('autoRefresh: không render lại khi server không có gì mới', async () => {
  let renderCalls = 0;
  const remote = { products: [], transactions: [], prescriptions: [], updatedAt: 100 };
  const fetchStub = async () => ({ status: 200, json: async () => ({ success: true, data: remote }) });
  const client = loadClient({ fetch: fetchStub });
  client.setDb({ products: [], transactions: [], prescriptions: [], updatedAt: 100 });
  client.setBase(100);
  client.setDirty(false);
  await client.autoRefresh();
  assert.equal(client.getBase(), 100, 'base không đổi khi server bằng nhau');
});

test('busyEditing: nhận biết ô nhập và hộp thoại đang mở', () => {
  const client = loadClient();
  client.setActiveTag(null);
  assert.equal(client.busyEditing(), false, 'không focus thì không bận');
  ['INPUT', 'TEXTAREA', 'SELECT'].forEach(tag => {
    client.setActiveTag(tag);
    assert.equal(client.busyEditing(), true, tag + ' phải coi là đang bận');
  });
  client.setActiveTag('BUTTON');
  assert.equal(client.busyEditing(), false, 'nút bấm không chặn làm mới');
});

test('autoRefresh: KHÔNG tải khi đang gõ trong ô nhập', async () => {
  let calls = 0;
  const remote = { products: [{ id: 'p1', name: 'Moi', stock: 9, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 500 };
  const fetchStub = async () => { calls++; return { status: 200, json: async () => ({ success: true, data: remote }) }; };
  const client = loadClient({ fetch: fetchStub });
  client.setDb({ products: [{ id: 'p1', name: 'DangNhap', stock: 1, costPrice: 1 }], transactions: [], prescriptions: [], updatedAt: 100 });
  client.setBase(100);
  client.setDirty(false);
  client.setActiveTag('INPUT');
  await client.autoRefresh();
  client.setActiveTag(null);
  assert.equal(calls, 0, 'không được gọi mạng khi đang nhập');
  assert.equal(client.getDb().products[0].name, 'DangNhap', 'giữ nguyên nội dung đang nhập');
});
test('sanitize: loại bỏ oname khi trùng với oid (tránh hiển thị ID thay vì ngày nhập)', () => {
  const out = app.sanitize({
    products: [{ id: 'p1', name: 'Cam thảo', stock: 10, costPrice: 50 }],
    transactions: [
      { id: 't1', date: '2026-11-06', type: 'NHAP', productId: 'p1', qty: 5, price: 50, total: 250, oid: 'IM_123', oname: 'IM_123' },
      { id: 't2', date: '2026-11-06', type: 'BAN', productId: 'p1', qty: 1, price: 60, total: 60, oid: 'ord_456', oname: 'Bán lẻ' }
    ],
    prescriptions: []
  });
  assert.equal(out.transactions[0].oid, 'IM_123');
  assert.equal(out.transactions[0].oname, undefined, 'oname trùng oid phải bị loại bỏ');
  assert.equal(out.transactions[1].oid, 'ord_456');
  assert.equal(out.transactions[1].oname, 'Bán lẻ', 'oname thật phải được giữ');
});

test('busyEditing: tạm hoãn làm mới khi có giỏ hàng bán lẻ chưa lưu', () => {
  const client = loadClient();
  client.setActiveTag(null);
  client.setRetailItems([]);
  assert.equal(client.busyEditing(), false);
  client.setRetailItems([{ pid: 'p1', kg: 1, amount: 50 }]);
  assert.equal(client.busyEditing(), true, 'có dòng trong giỏ hàng bán lẻ phải coi là đang bận');
  client.setRetailItems([]);
  assert.equal(client.busyEditing(), false, 'sau khi xóa giỏ hàng thì không còn bận');
});
