/**
 * Quản Lý Kho — Cloudflare Worker
 * ---------------------------------------------------------------
 * Viết lại toàn bộ để tối ưu điểm PageSpeed Insights (Mobile + Desktop).
 *
 * Nguyên tắc:
 *  1. KHÔNG phụ thuộc CDN nào (bỏ Tailwind CDN, Font Awesome, Google Fonts, Chart.js).
 *  2. CSS nhỏ, viết tay, nhúng inline -> không có request chặn render.
 *  3. Dữ liệu KV render thẳng vào HTML (SSR) -> LCP không chờ mạng.
 *  4. Icon = SVG sprite inline -> 0 byte font, 0 request.
 *  5. JS thuần, event delegation, không onclick inline, không innerHTML động.
 *  6. CSP nonce + security headers -> điểm Best Practices.
 *  7. Font hệ thống -> không FOUT, không CLS.
 */

import { PAGE } from './src/page.js';

const MAX_BODY = 4 * 1024 * 1024;
const MAX_INLINE = 200 * 1024;

/* ============================ WORKER ============================ */

function nonce(){
  return crypto.randomUUID().replace(/-/g, '');
}

function bootJson(data){
  try {
    var s = JSON.stringify(data);
    if (s.length > MAX_INLINE) return { json: 'null', needFetch: true };
    return { json: s.replace(/</g, '\\u003c'), needFetch: false };
  } catch (e) {
    return { json: 'null', needFetch: true };
  }
}

function securityHeaders(n){
  return {
    'Content-Security-Policy':
      "default-src 'none'; script-src 'nonce-" + n + "'; style-src 'nonce-" + n + "'; " +
      "img-src 'self' data:; connect-src 'self'; font-src 'self'; " +
      "base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Robots-Tag': 'noindex, nofollow'
  };
}

function decNum(value){
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function decNullable(value){
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function getSourceUpdatedAt(db){
  const row = await db.prepare("SELECT value FROM app_meta WHERE key = 'source_updated_at'").first();
  return row ? Number(row.value) || 0 : 0;
}

async function readState(db){
  const [productsResult, transactionsResult, prescriptionsResult, prescriptionItemsResult, sourceUpdatedAt] = await Promise.all([
    db.prepare('SELECT id, name, stock_kg AS stock, cost_price_vnd AS costPrice FROM products ORDER BY name COLLATE NOCASE').all(),
    db.prepare('SELECT id, date, type, product_id AS productId, qty_kg AS qty, price_vnd AS price, total_vnd AS total, cost_vnd AS cost, order_id AS oid, order_name AS oname, retail, rx, grams AS g, thang, unit_price_vnd AS unitPrice, ts FROM transactions ORDER BY COALESCE(ts, 0) ASC, rowid ASC').all(),
    db.prepare('SELECT id, name, total_vnd AS total, thang, updated_at AS updatedAt FROM prescriptions ORDER BY updated_at DESC, rowid ASC').all(),
    db.prepare('SELECT prescription_id AS prescriptionId, product_id AS productId, grams FROM prescription_items ORDER BY prescription_id, rowid ASC').all(),
    getSourceUpdatedAt(db)
  ]);
  const itemsByPrescription = new Map();
  for (const item of prescriptionItemsResult.results || []) {
    const list = itemsByPrescription.get(item.prescriptionId) || [];
    list.push({ productId: String(item.productId), grams: decNum(item.grams) });
    itemsByPrescription.set(item.prescriptionId, list);
  }
  return {
    products: (productsResult.results || []).map(p => ({ id: String(p.id), name: String(p.name), stock: decNum(p.stock), costPrice: decNum(p.costPrice) })),
    transactions: (transactionsResult.results || []).map(t => {
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
    prescriptions: (prescriptionsResult.results || []).map(r => ({ id: String(r.id), name: String(r.name), items: itemsByPrescription.get(r.id) || [], total: decNum(r.total), thang: Math.max(1, Math.round(decNum(r.thang)) || 1), updatedAt: decNum(r.updatedAt) })),
    updatedAt: sourceUpdatedAt
  };
}

function isNonNegNumber(value){
  if (value == null || value === '') return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

/* Kiểm tra + chuẩn hoá snapshot trước khi ghi: chặn dữ liệu âm/sai định dạng
   và tự loại bản ghi trùng khoá để db.batch() không bị rollback toàn bộ. */
function validateState(d){
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
    const id = String(p.id || crypto.randomUUID());
    const nameKey = name.toLowerCase();
    if (productIds.has(id)) { warn('Bỏ sản phẩm trùng id: ' + id); return; }
    if (productNames.has(nameKey)) { warn('Bỏ sản phẩm trùng tên: ' + name); return; }
    productIds.add(id);
    productNames.add(nameKey);
    state.products.push({ id, name, stock: decNum(p.stock), costPrice: decNum(p.costPrice) });
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
    const id = String(t.id || crypto.randomUUID());
    if (txIds.has(id)) { warn('Bỏ giao dịch trùng id: ' + id); return; }
    txIds.add(id);
    state.transactions.push({
      id, date: String(t.date), type: t.type, productId,
      qty: decNum(t.qty), price: decNum(t.price), total: decNum(t.total), cost: decNullable(t.cost),
      orderId: t.oid == null ? null : String(t.oid), orderName: t.oname == null ? null : String(t.oname),
      retail: !!t.retail, rx: !!t.rx, grams: decNullable(t.g), thang: decNullable(t.thang),
      unitPrice: decNullable(t.unitPrice), ts: decNullable(t.ts)
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
    const id = String(r.id || crypto.randomUUID());
    /* prescriptions.name là UNIQUE phân biệt hoa/thường. */
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
      id, name, items, total: decNum(r.total),
      thang: Math.max(1, Math.round(decNum(r.thang)) || 1), updatedAt: decNum(r.updatedAt)
    });
  });

  return { state, errors, warnings };
}

function sanitizeState(d){
  const out = { products: [], transactions: [], prescriptions: [], updatedAt: 0 };
  if (!d || typeof d !== 'object') return out;
  out.updatedAt = decNum(d.updatedAt);
  for (const p of Array.isArray(d.products) ? d.products : []) {
    if (!p || !p.name) continue;
    out.products.push({ id: String(p.id || crypto.randomUUID()), name: String(p.name), stock: decNum(p.stock), costPrice: decNum(p.costPrice) });
  }
  for (const t of Array.isArray(d.transactions) ? d.transactions : []) {
    if (!t) continue;
    const tx = {
      id: String(t.id || crypto.randomUUID()), date: String(t.date || ''), type: t.type === 'NHAP' ? 'NHAP' : 'BAN',
      productId: String(t.productId || ''), qty: decNum(t.qty), price: decNum(t.price), total: decNum(t.total), cost: decNullable(t.cost),
      orderId: t.oid == null ? null : String(t.oid), orderName: t.oname == null ? null : String(t.oname),
      retail: !!t.retail, rx: !!t.rx, grams: decNullable(t.g), thang: decNullable(t.thang), unitPrice: decNullable(t.unitPrice), ts: decNullable(t.ts)
    };
    out.transactions.push(tx);
  }
  for (const r of Array.isArray(d.prescriptions) ? d.prescriptions : []) {
    if (!r || !r.name || !Array.isArray(r.items)) continue;
    const items = [];
    for (const item of r.items) {
      if (!item || !item.productId) continue;
      items.push({ productId: String(item.productId), grams: decNum(item.grams) });
    }
    if (!items.length) continue;
    out.prescriptions.push({ id: String(r.id || crypto.randomUUID()), name: String(r.name), items, total: decNum(r.total), thang: Math.max(1, Math.round(decNum(r.thang)) || 1), updatedAt: decNum(r.updatedAt) });
  }
  return out;
}

async function writeState(db, data){
  const state = sanitizeState(data);
  const now = Date.now();
  const statements = [
    db.prepare('DELETE FROM prescription_items'),
    db.prepare('DELETE FROM prescriptions'),
    db.prepare('DELETE FROM transactions'),
    db.prepare('DELETE FROM products'),
    db.prepare(`INSERT INTO app_meta (key, value) VALUES ('source_updated_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`).bind(String(now))
  ];
  for (const p of state.products) {
    statements.push(db.prepare('INSERT INTO products (id, name, stock_kg, cost_price_vnd, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(p.id, p.name, p.stock, p.costPrice, now, now));
  }
  for (const t of state.transactions) {
    statements.push(db.prepare('INSERT INTO transactions (id, date, type, product_id, qty_kg, price_vnd, total_vnd, cost_vnd, order_id, order_name, retail, rx, grams, thang, unit_price_vnd, ts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(t.id, t.date, t.type, t.productId, t.qty, t.price, t.total, t.cost, t.orderId, t.orderName, t.retail ? 1 : 0, t.rx ? 1 : 0, t.grams, t.thang, t.unitPrice, t.ts, now));
  }
  for (const r of state.prescriptions) {
    statements.push(db.prepare('INSERT INTO prescriptions (id, name, total_vnd, thang, updated_at) VALUES (?, ?, ?, ?, ?)').bind(r.id, r.name, r.total, r.thang, r.updatedAt || now));
    for (const item of r.items) {
      statements.push(db.prepare('INSERT INTO prescription_items (prescription_id, product_id, grams) VALUES (?, ?, ?)').bind(r.id, item.productId, item.grams));
    }
  }
  await db.batch(statements);
  return now;
}

function jsonRes(obj, status){
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function getCookie(request, name){
  const raw = request.headers.get('Cookie') || '';
  const parts = raw.split(';');
  for (let i = 0; i < parts.length; i++) {
    const idx = parts[i].indexOf('=');
    if (idx === -1) continue;
    if (parts[i].slice(0, idx).trim() !== name) continue;
    const v = parts[i].slice(idx + 1).trim();
    try { return decodeURIComponent(v); } catch (e) { return v; }
  }
  return '';
}
function validBearer(request, envToken){
  const auth = String(request.headers.get('Authorization') || '').trim();
  return auth !== '' && auth === 'Bearer ' + envToken;
}
function validCookie(request, envToken){
  return String(getCookie(request, 'qlk_token')).trim() === envToken;
}
function redirectTo(path){
  return new Response(null, { status: 303, headers: { 'Location': path, 'Cache-Control': 'no-store' } });
}
function logout(){
  return new Response(null, { status: 303, headers: {
    'Location': '/login',
    'Set-Cookie': 'qlk_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'Cache-Control': 'no-store'
  } });
}
function clientIp(request){
  return String(request.headers.get('CF-Connecting-IP') || 'unknown').trim();
}
async function loginFails(env, ip){
  try {
    if (!env || !env.KV) return 0;
    const raw = await env.KV.get('login_fail:' + ip);
    const n = parseInt(raw || '0', 10);
    return Number.isFinite(n) ? n : 0;
  } catch (e) { return 0; }
}
async function addLoginFail(env, ip){
  try {
    if (!env || !env.KV) return;
    const n = (await loginFails(env, ip)) + 1;
    await env.KV.put('login_fail:' + ip, String(n), { expirationTtl: 600 });
  } catch (e) {}
}
async function clearLoginFails(env, ip){
  try { if (env && env.KV) await env.KV.delete('login_fail:' + ip); } catch (e) {}
}
async function handleLogin(request, envToken, env){
  const ip = clientIp(request);
  if ((await loginFails(env, ip)) >= 10) {
    return loginPage('locked');
  }
  let token = '';
  try {
    const text = (await request.text()).slice(0, 2048);
    token = String(new URLSearchParams(text).get('token') || '').trim();
  } catch (e) { token = ''; }
  if (token !== '' && token === envToken) {
    await clearLoginFails(env, ip);
    return new Response(null, { status: 303, headers: {
      'Location': '/',
      'Set-Cookie': 'qlk_token=' + encodeURIComponent(token) + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=315360000; Secure',
      'Cache-Control': 'no-store'
    } });
  }
  await addLoginFail(env, ip);
  await new Promise(r => setTimeout(r, 800));
  return loginPage('wrong');
}
function loginPage(kind){
  let err = '';
  let status = 200;
  if (kind === 'locked') {
    err = '<p class="err" role="alert">Quá nhiều lần nhập sai. Vui lòng đợi ~10 phút rồi thử lại.</p>';
    status = 429;
  } else if (kind === 'wrong' || kind === true) {
    err = '<p class="err" role="alert">Mã truy cập sai, thử lại.</p>';
    status = 401;
  }
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Quản Lý Kho — Đăng nhập</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #0f1420; color: #e8ecf4;
    font: 16px/1.5 "Segoe UI", system-ui, sans-serif; padding: 24px; }
  .card { width: 100%; max-width: 380px; background: #171d2b; border: 1px solid #262f44;
    border-radius: 18px; padding: 28px 26px; box-shadow: 0 12px 40px rgba(0,0,0,.35); }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { margin: 0 0 18px; color: #9aa7bd; font-size: 13px; }
  label { display: block; font-size: 12px; color: #9aa7bd; margin-bottom: 6px; }
  input[type=password] { width: 100%; padding: 12px 14px; border-radius: 12px;
    border: 1px solid #2d3850; background: #10151f; color: inherit; font-size: 15px; }
  input[type=password]:focus { outline: 2px solid #3b82f6; border-color: transparent; }
  button { margin-top: 14px; width: 100%; padding: 12px; border: 0; border-radius: 12px;
    background: #3b82f6; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
  button:hover { background: #2563eb; }
  .err { margin: 12px 0 0; color: #ff8d8d; font-size: 13px; }
</style>
</head>
<body>
  <main class="card">
    <h1>Quản Lý Kho</h1>
    <p class="sub">Khu vực riêng tư — nhập mã truy cập để tiếp tục.</p>
    <form method="POST" action="/login">
      <label for="t">Mã truy cập</label>
      <input id="t" name="token" type="password" autocomplete="current-password" autofocus required>
      <button type="submit">Vào</button>
    </form>
    ${err}
  </main>
</body>
</html>`;
  return new Response(html, { status: status, headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex'
  } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const d1 = env && env.DB;

    // Không cho website khác gọi API (không còn CORS).
    if (method === 'OPTIONS') return new Response(null, { status: 204 });

    // ---------- Bảo vệ bằng mã truy cập (1 người dùng) ----------
    // / và mọi API đều cần đăng nhập (cookie qlk_token) hoặc Bearer token.
    // Chưa đăng nhập: / → trang login (không chứa dữ liệu); /api/* → 401.
    const envToken = env.APP_TOKEN ? String(env.APP_TOKEN).trim() : '';
    const authed = !!envToken && (validBearer(request, envToken) || validCookie(request, envToken));
    const PUBLIC_PATHS = ['/favicon.ico', '/robots.txt'];

    if (url.pathname === '/logout') return logout();
    if (url.pathname === '/login') {
      if (!envToken) return new Response('Server chua cau hinh APP_TOKEN', { status: 500 });
      if (method === 'POST') return handleLogin(request, envToken, env);
      if (method === 'GET') return authed ? redirectTo('/') : loginPage(false);
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });
    }

    if (PUBLIC_PATHS.indexOf(url.pathname) === -1 && !authed) {
      if (url.pathname.indexOf('/api/') === 0) {
        if (!envToken) return jsonRes({ success: false, error: 'Server chưa cấu hình APP_TOKEN' }, 500);
        return jsonRes({ success: false, error: 'Unauthorized' }, 401);
      }
      if (!envToken) return new Response('Server chua cau hinh APP_TOKEN', { status: 500 });
      if (url.pathname === '/') return loginPage(false);
      return new Response('Unauthorized', { status: 401 });
    }

    if (url.pathname === '/favicon.ico') {
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'public, max-age=86400' } });
    }

    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // ---------- Đồng bộ dữ liệu D1 ----------
    if (url.pathname === '/api/state') {
      try {
        if (!d1) return jsonRes({ success: false, error: 'D1 chưa được cấu hình' }, 503);
        if (method === 'GET') {
          const data = await readState(d1);
          return jsonRes({ success: true, data });
        }
        if (method === 'PUT') {
          const len = Number(request.headers.get('content-length') || 0);
          if (len > MAX_BODY) return jsonRes({ success: false, error: 'Payload too large' }, 413);
          const text = await request.text();
          if (text.length > MAX_BODY) return jsonRes({ success: false, error: 'Payload too large' }, 413);
          let body;
          try {
            body = JSON.parse(text);
          } catch (e) {
            return jsonRes({ success: false, error: 'JSON không hợp lệ' }, 400);
          }
          const checked = validateState(body);
          if (checked.errors.length) {
            return jsonRes({ success: false, error: 'Dữ liệu không hợp lệ', details: checked.errors }, 400);
          }
          const baseHdr = request.headers.get('X-Base-Updated');
          if (baseHdr !== null && request.headers.get('X-Force') !== '1') {
            const baseNum = Number(baseHdr);
            if (Number.isFinite(baseNum)) {
              const current = await getSourceUpdatedAt(d1);
              if (current > baseNum) {
                return jsonRes({ success: false, conflict: true, updatedAt: current }, 409);
              }
            }
          }
          const updatedAt = await writeState(d1, checked.state);
          return jsonRes({ success: true, updatedAt, warnings: checked.warnings.length ? checked.warnings : undefined });
        }
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, PUT' } });
      } catch (err) {
        console.error('/api/state', err);
        return jsonRes({ success: false, error: 'Không đọc/ghi được dữ liệu' }, 500);
      }
    }

    if (method !== 'GET' && method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    // ---------- Trang chính ----------
    if (!d1) {
      return new Response('D1 chưa được cấu hình', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    let data = null;
    try {
      data = await readState(d1);
    } catch (e) {
      console.error('readState', e);
      return new Response('Không đọc được dữ liệu. Vui lòng thử lại sau.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    const n = nonce();
    const boot = bootJson(data);
    const html = PAGE
      .split('%%NONCE%%').join(n)
      .split('%%BOOT%%').join(boot.json)
      .split('%%NEEDFETCH%%').join(boot.needFetch ? 'true' : 'false');

    return new Response(method === 'HEAD' ? null : html, {
      headers: Object.assign({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'Vary': 'Accept-Encoding, Cookie'
      }, securityHeaders(n))
    });
  }
};
