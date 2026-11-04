CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stock_kg REAL NOT NULL DEFAULT 0,
  cost_price_vnd REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_products_name_nocase
  ON products(name COLLATE NOCASE);

CREATE TABLE transactions (
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

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_product ON transactions(product_id);
CREATE INDEX idx_transactions_type_ts ON transactions(type, ts);

CREATE TABLE prescriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  total_vnd REAL NOT NULL DEFAULT 0,
  thang INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

CREATE TABLE prescription_items (
  prescription_id TEXT NOT NULL
    REFERENCES prescriptions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  grams REAL NOT NULL,
  PRIMARY KEY (prescription_id, product_id)
);

CREATE TABLE ledger (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('THU', 'CHI')),
  amount_vnd REAL NOT NULL CHECK (amount_vnd > 0),
  category TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
