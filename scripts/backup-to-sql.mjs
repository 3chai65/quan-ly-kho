#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] || fs.readdirSync('kho-backup')
  .filter(name => /^kho-backup-\d{4}-\d{2}-\d{2}\.json$/.test(name))
  .sort()
  .pop();

if (!input) {
  console.error('No backup file found in kho-backup/. Pass the backup path explicitly.');
  process.exit(1);
}

const file = path.resolve(process.cwd(), input.includes(path.sep) ? input : path.join('kho-backup', input));
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
const data = backup.data || backup;
const now = Date.now();
const sourceUpdatedAt = Number(data.updatedAt) || now;

const esc = value => String(value ?? '').replace(/'/g, "''");
const sqlString = value => value == null || value === '' ? 'NULL' : `'${esc(value)}'`;
const sqlNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : String(fallback);
};
const sqlNullableNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : 'NULL';
};
const sqlBool = value => value ? '1' : '0';
const lines = [];
const add = line => lines.push(line);

const products = Array.isArray(data.products) ? data.products : [];
const transactions = Array.isArray(data.transactions) ? data.transactions : [];
const prescriptions = Array.isArray(data.prescriptions) ? data.prescriptions : [];
const ledger = Array.isArray(data.ledger) ? data.ledger : [];

add('DELETE FROM prescription_items;');
add('DELETE FROM prescriptions;');
add('DELETE FROM transactions;');
add('DELETE FROM products;');
add('DELETE FROM ledger;');
add('DELETE FROM app_meta;');

for (const p of products) {
  add(
    `INSERT INTO products (id, name, stock_kg, cost_price_vnd, created_at, updated_at) VALUES (${sqlString(p.id)}, ${sqlString(p.name)}, ${sqlNumber(p.stock)}, ${sqlNumber(p.costPrice)}, ${sqlNumber(sourceUpdatedAt)}, ${sqlNumber(sourceUpdatedAt)});`
  );
}

for (const t of transactions) {
  const type = t.type === 'NHAP' ? 'NHAP' : 'BAN';
  const ts = Number(t.ts);
  const createdAt = Number.isFinite(ts) && ts > 0 ? ts : sourceUpdatedAt;
  add(
    `INSERT INTO transactions (id, date, type, product_id, qty_kg, price_vnd, total_vnd, cost_vnd, order_id, order_name, retail, rx, grams, thang, unit_price_vnd, ts, created_at) VALUES (${sqlString(t.id)}, ${sqlString(t.date)}, '${type}', ${sqlString(t.productId)}, ${sqlNumber(t.qty)}, ${sqlNumber(t.price)}, ${sqlNumber(t.total)}, ${sqlNullableNumber(t.cost)}, ${sqlString(t.oid)}, ${sqlString(t.oname)}, ${sqlBool(t.retail)}, ${sqlBool(t.rx)}, ${sqlNullableNumber(t.g)}, ${sqlNullableNumber(t.thang)}, ${sqlNullableNumber(t.unitPrice)}, ${sqlNullableNumber(t.ts)}, ${sqlNumber(createdAt)});`
  );
}

for (const r of prescriptions) {
  add(
    `INSERT INTO prescriptions (id, name, total_vnd, thang, updated_at) VALUES (${sqlString(r.id)}, ${sqlString(r.name)}, ${sqlNumber(r.total)}, ${Math.max(1, Math.round(Number(r.thang)) || 1)}, ${sqlNumber(r.updatedAt, sourceUpdatedAt)});`
  );
  for (const item of Array.isArray(r.items) ? r.items : []) {
    add(
      `INSERT INTO prescription_items (prescription_id, product_id, grams) VALUES (${sqlString(r.id)}, ${sqlString(item.productId)}, ${sqlNumber(item.grams)});`
    );
  }
}

for (const entry of ledger) {
  const type = entry.type === 'CHI' ? 'CHI' : 'THU';
  const ts = Number(entry.ts);
  add(
    `INSERT INTO ledger (id, date, type, amount_vnd, category, ts) VALUES (${sqlString(entry.id)}, ${sqlString(entry.date)}, '${type}', ${sqlNumber(entry.amount)}, ${sqlString(entry.category || 'Khác')}, ${sqlNumber(Number.isFinite(ts) && ts > 0 ? ts : sourceUpdatedAt)});`
  );
}

add(`INSERT INTO app_meta (key, value) VALUES ('schema_version', '1');`);
add(`INSERT INTO app_meta (key, value) VALUES ('source_updated_at', '${esc(sourceUpdatedAt)}');`);
process.stdout.write(lines.join('\n') + '\n');
