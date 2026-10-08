import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Cloudflare D1 database access for OpenNext.
 *
 * The binding is resolved from the current Worker request. We deliberately do
 * not keep the Drizzle client in a process/global singleton.
 */

function createDatabase(database: D1Database) {
  return drizzle(database, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

const INITIAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_admin INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  code INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  category TEXT DEFAULT 'سایر' NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT DEFAULT '' NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)) NOT NULL,
  updated_at INTEGER DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  total_amount INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  address TEXT,
  receipt_image TEXT NOT NULL,
  admin_note TEXT,
  telegram_status TEXT DEFAULT 'not_sent' NOT NULL,
  created_at INTEGER DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)) NOT NULL,
  updated_at INTEGER DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_code INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS products_code_unique ON products(code);
`;

async function ensureSchema(database: D1Database) {
  const existing = await database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users' LIMIT 1")
    .first<{ name: string }>();

  if (!existing) {
    await database.exec(INITIAL_SCHEMA_SQL);
  }
}

/**
 * Resolve the D1-backed database from the current Cloudflare request.
 *
 * The database is initialized lazily when the new/empty D1 database has not
 * received its tables yet. This protects deployments where the D1 database ID
 * is changed without a manual migration step.
 */
export async function getDb(): Promise<Database> {
  const { env } = getCloudflareContext();

  if (!env.DB) {
    throw new Error(
      "D1 binding `DB` is missing from the active Cloudflare Worker environment. " +
        "Make sure wrangler.jsonc defines d1_naghshiran and the latest Worker deployment includes that binding."
    );
  }

  await ensureSchema(env.DB);
  return createDatabase(env.DB);
}
