/**
 * Quản Lý Kho — server local (Docker + SQLite)
 * ---------------------------------------------------------------
 * Bản thay thế `worker.js` (Cloudflare Worker + D1) để chạy hoàn toàn
 * trong mạng nội bộ (LAN), dữ liệu là file SQLite thật trên ổ cứng.
 *
 * Giữ NGUYÊN hợp đồng API của worker cũ:
 *   GET  /api/state          -> { success:true, data:{products,transactions,prescriptions,updatedAt} }
 *   PUT  /api/state          -> ghi snapshot; hỗ trợ X-Base-Updated / X-Force (409 conflict)
 *   GET  /                   -> HTML (src/page.js với placeholder CSP/SSR)
 *
 * Thay đổi so với bản Cloudflare:
 *   - Bỏ xác thực (chạy trong LAN nội bộ) — không còn /login, cookie, APP_TOKEN.
 *   - Không có nonce động: CSP cho phép 'unsafe-inline' (trang tĩnh nội bộ).
 *   - SQLite chạy đồng bộ (better-sqlite3), ghi trong 1 transaction.
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import Database from 'better-sqlite3';

import { PAGE } from './src/page.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 8787;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'app.db');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(DATA_DIR, 'backups');
const BACKUP_KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS) || 30;
const MAX_BODY = 4 * 1024 * 1024;
const MAX_INLINE = 200 * 1024;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ============================ DATABASE ============================ */

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      stock_kg REAL NOT NULL DEFAULT 0,
      cost_price_vnd REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name_nocase
      ON products(name COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('NHAP', 'BAN')),
      product_id TEXT NOT NULL,
      qty_kg REAL NOT NULL,
      price_vnd REAL NOT NULL,
      total_vnd REAL NOT NULL,
      cost_vnd REAL,
      order_id TEXT,
      order_name TEXT,
      retail INTEGER NOT NULL DEFAULT 0,
      rx INTEGER NOT NULL DEFAULT 0,
      grams REAL,
      thang INTEGER,
      unit_price_vnd REAL,
      ts INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_product ON transactions(product_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type_ts ON transactions(type, ts);

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      total_vnd REAL NOT NULL DEFAULT 0,
      thang INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prescription_items (
      prescription_id TEXT NOT NULL
        REFERENCES prescriptions(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      grams REAL NOT NULL,
      PRIMARY KEY (prescription_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
migrate();

/* ============================ STATE ============================ */

function decNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function decNullable(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
/* Tiền (đơn vị nghìn VND) lưu dạng số nguyên. */
function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
function moneyNullable(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function getSourceUpdatedAt() {
  const row = db.prepare("SELECT value FROM app_meta WHERE key = 'source_updated_at'").get();
  return row ? Number(row.value) || 0 : 0;
}

function readState() {
  const products = db.prepare('SELECT id, name, stock_kg AS stock, cost_price_vnd AS costPrice FROM products ORDER BY name COLLATE NOCASE').all();
  const transactions = db.prepare('SELECT id, date, type, product_id AS productId, qty_kg AS qty, price_vnd AS price, total_vnd AS total, cost_vnd AS cost, order_id AS oid, order_name AS oname, retail, rx, grams AS g, thang, unit_price_vnd AS unitPrice, ts FROM transactions ORDER BY COALESCE(ts, 0) ASC, rowid ASC').all();
  const prescriptions = db.prepare('SELECT id, name, total_vnd AS total, thang, updated_at AS updatedAt FROM prescriptions ORDER BY updated_at DESC, rowid ASC').all();
  const prescriptionItems = db.prepare('SELECT prescription_id AS prescriptionId, product_id AS productId, grams FROM prescription_items ORDER BY prescription_id, rowid ASC').all();

  const itemsByPrescription = new Map();
  for (const item of prescriptionItems) {
    const list = itemsByPrescription.get(item.prescriptionId) || [];
    list.push({ productId: String(item.productId), grams: decNum(item.grams) });
    itemsByPrescription.set(item.prescriptionId, list);
  }

  return {
    products: products.map(p => ({ id: String(p.id), name: String(p.name), stock: decNum(p.stock), costPrice: decNum(p.costPrice) })),
    transactions: transactions.map(t => {
      const tx = {
        id: String(t.id), date: String(t.date), type: t.type === 'NHAP' ? 'NHAP' : 'BAN',
        productId: String(t.productId), qty: decNum(t.qty), price: decNum(t.price), total: decNum(t.total),
        cost: decNullable(t.cost), oid: t.oid == null ? undefined : String(t.oid), oname: t.oname == null ? undefined : String(t.oname),
        retail: !!Number(t.retail), rx: !!Number(t.rx), g: decNullable(t.g), thang: decNullable(t.thang),
        unitPrice: decNullable(t.unitPrice), ts: decNullable(t.ts)
      };
      if (tx.cost == null) delete tx.cost;
      if (tx.oid == null) delete tx.oid;
      if (tx.oname == null) delete tx.oname;
      if (!tx.retail) delete tx.retail;
      if (!tx.rx) delete tx.rx;
      if (tx.g == null) delete tx.g;
      if (tx.thang == null) delete tx.thang;
      if (tx.unitPrice == null) delete tx.unitPrice;
      if (tx.ts == null) delete tx.ts;
      return tx;
    }),
    prescriptions: prescriptions.map(r => ({
      id: String(r.id), name: String(r.name), items: itemsByPrescription.get(r.id) || [],
      total: decNum(r.total), thang: Math.max(1, Math.round(decNum(r.thang)) || 1), updatedAt: decNum(r.updatedAt)
    })),
    updatedAt: getSourceUpdatedAt()
  };
}

function isNonNegNumber(value) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

function validateState(d) {
  const errors = [];
  const warnings = [];
  const state = { products: [], transactions: [], prescriptions: [], updatedAt: 0 };
  if (!d || typeof d !== 'object' || Array.isArray(d)) {
    return { state, errors: ['Dữ liệu không phải object'], warnings };
  }
  const fail = msg => { if (errors.length < 20) errors.push(msg); };
  const warn = msg => { if (warnings.length < 50) warnings.push(msg); };
  for (const key of ['products', 'transactions', 'prescriptions']) {
    if (!Array.isArray(d[key])) fail('Thiếu mảng ' + key);
  }
  if (errors.length) return { state, errors, warnings };
  state.updatedAt = decNum(d.updatedAt);

  const productIds = new Set();
  const productNames = new Set();
  d.products.forEach((p, i) => {
    const label = 'Sản phẩm #' + (i + 1);
    if (!p || typeof p !== 'object') { fail(label + ': không hợp lệ'); return; }
    const name = String(p.name || '').trim();
    if (!name) { fail(label + ': thiếu tên'); return; }
    if (!isNonNegNumber(p.stock)) fail(label + ' "' + name + '": tồn kho phải >= 0');
    if (!isNonNegNumber(p.costPrice)) fail(label + ' "' + name + '": giá nhập phải >= 0');
    const id = String(p.id || randomId());
    const nameKey = name.toLowerCase();
    if (productIds.has(id)) { warn('Bỏ sản phẩm trùng id: ' + id); return; }
    if (productNames.has(nameKey)) { warn('Bỏ sản phẩm trùng tên: ' + name); return; }
    productIds.add(id);
    productNames.add(nameKey);
    state.products.push({ id, name, stock: decNum(p.stock), costPrice: money(p.costPrice) });
  });

  const txIds = new Set();
  d.transactions.forEach((t, i) => {
    const label = 'Giao dịch #' + (i + 1);
    if (!t || typeof t !== 'object') { fail(label + ': không hợp lệ'); return; }
    if (t.type !== 'NHAP' && t.type !== 'BAN') { fail(label + ': loại phải là NHAP hoặc BAN'); return; }
    if (!DATE_RE.test(String(t.date || ''))) { fail(label + ': ngày phải dạng YYYY-MM-DD'); return; }
    const productId = String(t.productId || '').trim();
    if (!productId) { fail(label + ': thiếu productId'); return; }
    if (!productIds.has(productId)) warn(label + ': productId không có trong danh sách sản phẩm: ' + productId);
    if (!(Number(t.qty) > 0)) fail(label + ': số lượng phải > 0');
    if (!isNonNegNumber(t.price)) fail(label + ': đơn giá phải >= 0');
    if (!isNonNegNumber(t.total)) fail(label + ': thành tiền phải >= 0');
    if (t.cost != null && !isNonNegNumber(t.cost)) fail(label + ': giá vốn phải >= 0');
    if (t.ts != null && !Number.isFinite(Number(t.ts))) fail(label + ': ts không hợp lệ');
    if (t.g != null && !isNonNegNumber(t.g)) fail(label + ': grams phải >= 0');
    if (t.thang != null && !(Number(t.thang) >= 1)) fail(label + ': số thang phải >= 1');
    if (t.unitPrice != null && !isNonNegNumber(t.unitPrice)) fail(label + ': giá 1 thang phải >= 0');
    const id = String(t.id || randomId());
    if (txIds.has(id)) { warn('Bỏ giao dịch trùng id: ' + id); return; }
    txIds.add(id);
    state.transactions.push({
      id, date: String(t.date), type: t.type, productId,
      qty: decNum(t.qty), price: money(t.price), total: money(t.total), cost: moneyNullable(t.cost),
      orderId: t.oid != null ? String(t.oid) : (t.oname != null ? String(t.oname) : null),
      orderName: t.oname != null ? String(t.oname) : (t.oid != null ? String(t.oid) : null),
      retail: !!t.retail, rx: !!t.rx, grams: decNullable(t.g), thang: decNullable(t.thang),
      unitPrice: moneyNullable(t.unitPrice), ts: decNullable(t.ts)
    });
  });

  const rxIds = new Set();
  const rxNames = new Set();
  d.prescriptions.forEach((r, i) => {
    const label = 'Đơn thuốc #' + (i + 1);
    if (!r || typeof r !== 'object') { fail(label + ': không hợp lệ'); return; }
    const name = String(r.name || '').trim();
    if (!name) { fail(label + ': thiếu tên'); return; }
    if (!Array.isArray(r.items) || !r.items.length) { fail(label + ' "' + name + '": chưa có vị thuốc'); return; }
    const id = String(r.id || randomId());
    const nameKey = name;
    if (rxIds.has(id)) { warn('Bỏ đơn thuốc trùng id: ' + id); return; }
    if (rxNames.has(nameKey)) { warn('Bỏ đơn thuốc trùng tên: ' + name); return; }
    rxIds.add(id);
    rxNames.add(nameKey);
    const itemIds = new Set();
    const items = [];
    r.items.forEach((item, j) => {
      if (!item || typeof item !== 'object') { fail(label + ' dòng ' + (j + 1) + ': không hợp lệ'); return; }
      const itemPid = String(item.productId || '').trim();
      if (!itemPid) { fail(label + ' dòng ' + (j + 1) + ': thiếu productId'); return; }
      if (!productIds.has(itemPid)) warn(label + ' dòng ' + (j + 1) + ': productId không có trong danh sách sản phẩm: ' + itemPid);
      if (!(Number(item.grams) > 0)) { fail(label + ' dòng ' + (j + 1) + ': số gram phải > 0'); return; }
      if (itemIds.has(itemPid)) { warn('Bỏ vị trùng trong đơn "' + name + '"'); return; }
      itemIds.add(itemPid);
      items.push({ productId: itemPid, grams: decNum(item.grams) });
    });
    if (!items.length) { fail(label + ' "' + name + '": không có dòng hợp lệ'); return; }
    state.prescriptions.push({
      id, name, items, total: money(r.total),
      thang: Math.max(1, Math.round(decNum(r.thang)) || 1), updatedAt: decNum(r.updatedAt)
    });
  });

  return { state, errors, warnings };
}

function randomId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

const insertProduct = () => db.prepare('INSERT INTO products (id, name, stock_kg, cost_price_vnd, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
const insertTx = () => db.prepare('INSERT INTO transactions (id, date, type, product_id, qty_kg, price_vnd, total_vnd, cost_vnd, order_id, order_name, retail, rx, grams, thang, unit_price_vnd, ts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertRx = () => db.prepare('INSERT INTO prescriptions (id, name, total_vnd, thang, updated_at) VALUES (?, ?, ?, ?, ?)');
const insertRxItem = () => db.prepare('INSERT INTO prescription_items (prescription_id, product_id, grams) VALUES (?, ?, ?)');

const writeStateTx = db.transaction((state, now) => {
  db.prepare('DELETE FROM prescription_items').run();
  db.prepare('DELETE FROM prescriptions').run();
  db.prepare('DELETE FROM transactions').run();
  db.prepare('DELETE FROM products').run();
  db.prepare(`INSERT INTO app_meta (key, value) VALUES ('source_updated_at', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(String(now));

  const ip = insertProduct();
  for (const p of state.products) ip.run(p.id, p.name, p.stock, p.costPrice, now, now);

  const it = insertTx();
  for (const t of state.transactions) {
    it.run(t.id, t.date, t.type, t.productId, t.qty, t.price, t.total, t.cost, t.orderId, t.orderName,
      t.retail ? 1 : 0, t.rx ? 1 : 0, t.grams, t.thang, t.unitPrice, t.ts, now);
  }

  const ir = insertRx();
  const ii = insertRxItem();
  for (const r of state.prescriptions) {
    ir.run(r.id, r.name, r.total, r.thang, r.updatedAt || now);
    for (const item of r.items) ii.run(r.id, item.productId, item.grams);
  }
});

function writeState(state) {
  const now = Date.now();
  writeStateTx(state, now);
  return now;
}

/* ============================ TỰ ĐỘNG SAO LƯU ============================ */
/*
 * Mỗi ngày tạo 1 bản backup file .db bằng SQLite VACUUM INTO (an toàn khi đang
 * ghi, không cần dừng app). Giữ 30 bản gần nhất, tự xóa bản cũ hơn.
 * Tên file: backup-YYYY-MM-DD.db
 */

function todayStamp() {
  const d = new Date();
  const p = n => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function runDailyBackup(force) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const file = path.join(BACKUP_DIR, 'backup-' + todayStamp() + '.db');
    if (fs.existsSync(file)) {
      if (force) fs.unlinkSync(file);
    }
    if (!fs.existsSync(file)) {
      // VACUUM INTO tạo bản sao nhất quán, không bị ảnh hưởng bởi ghi đồng thời.
      db.prepare('VACUUM INTO ?').run(file);
      console.log('[backup] Đã sao lưu: ' + file);
    }
  } catch (err) {
    console.error('[backup] Lỗi sao lưu:', err && err.message ? err.message : err);
  }
  pruneBackups();
}

function pruneBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(n => /^backup-\d{4}-\d{2}-\d{2}\.db$/.test(n))
      .sort();
    while (files.length > BACKUP_KEEP_DAYS) {
      const old = files.shift();
      fs.unlinkSync(path.join(BACKUP_DIR, old));
      console.log('[backup] Đã xóa bản cũ: ' + old);
    }
  } catch (err) {
    console.error('[backup] Lỗi dọn bản cũ:', err && err.message ? err.message : err);
  }
}

/* ============================ BOOT JSON ============================ */

function bootJson(data) {
  try {
    const s = JSON.stringify(data);
    if (s.length > MAX_INLINE) return { json: 'null', needFetch: true };
    return { json: s.replace(/</g, '\\u003c'), needFetch: false };
  } catch (e) {
    return { json: 'null', needFetch: true };
  }
}

/* ============================ HTTP ============================ */

const app = express();
app.disable('x-powered-by');
app.use(express.text({ type: '*/*', limit: MAX_BODY }));

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

app.get('/api/state', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    res.json({ success: true, data: readState() });
  } catch (err) {
    console.error('/api/state GET', err);
    res.status(500).json({ success: false, error: 'Không đọc được dữ liệu' });
  }
});

app.put('/api/state', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const text = typeof req.body === 'string' ? req.body : '';
    if (text.length > MAX_BODY) return res.status(413).json({ success: false, error: 'Payload too large' });
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'JSON không hợp lệ' });
    }
    const checked = validateState(body);
    if (checked.errors.length) {
      return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ', details: checked.errors });
    }
    const baseHdr = req.get('X-Base-Updated');
    if (baseHdr != null && req.get('X-Force') !== '1') {
      const baseNum = Number(baseHdr);
      // Header không phải số hợp lệ → coi như xung đột (an toàn) thay vì bỏ qua kiểm tra.
      if (!Number.isFinite(baseNum)) {
        return res.status(400).json({ success: false, error: 'X-Base-Updated không hợp lệ' });
      }
      const current = getSourceUpdatedAt();
      if (current > baseNum) {
        return res.status(409).json({ success: false, conflict: true, updatedAt: current });
      }
    }
    const updatedAt = writeState(checked.state);
    runDailyBackup(false); // tạo bản backup ngày (nếu chưa có)
    res.json({ success: true, updatedAt, warnings: checked.warnings.length ? checked.warnings : undefined });
  } catch (err) {
    console.error('/api/state PUT', err);
    res.status(500).json({ success: false, error: 'Không ghi được dữ liệu' });
  }
});

// Trang chính: SSR data vào PAGE (giống worker cũ).
app.get('/', (req, res) => {
  let data = null;
  try {
    data = readState();
  } catch (e) {
    console.error('readState', e);
    return res.status(503).type('text/plain').send('Không đọc được dữ liệu. Vui lòng thử lại sau.');
  }
  const boot = bootJson(data);
  const html = PAGE
    .split('%%NONCE%%').join('')            // không dùng nonce (LAN nội bộ)
    .split('%%BOOT%%').join(boot.json)
    .split('%%NEEDFETCH%%').join(boot.needFetch ? 'true' : 'false');

  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Robots-Tag': 'noindex, nofollow'
  });
  res.send(html);
});

app.get('/api/backups', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(n => /^backup-\d{4}-\d{2}-\d{2}\.db$/.test(n))
      .sort()
      .reverse()
      .map(n => {
        const st = fs.statSync(path.join(BACKUP_DIR, n));
        return { name: n, size: st.size, modified: st.mtime.toISOString() };
      });
    res.json({ success: true, dir: BACKUP_DIR, keepDays: BACKUP_KEEP_DAYS, count: files.length, backups: files });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Không đọc được danh sách backup' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Quản Lý Kho (local) đang chạy:');
  console.log('  PC    : http://localhost:' + PORT);
  console.log('  Mobile: http://<IP-máy-tính>:' + PORT);
  console.log('  DB    : ' + DB_FILE);
  console.log('  Backup: ' + BACKUP_DIR + ' (giữ ' + BACKUP_KEEP_DAYS + ' ngày)');

  // Sao lưu ngay khi khởi động (nếu hôm nay chưa có), rồi kiểm tra mỗi giờ
  // để kịp chụp khi app chạy qua nửa đêm.
  runDailyBackup(false);
  setInterval(() => runDailyBackup(false), 60 * 60 * 1000);
});
