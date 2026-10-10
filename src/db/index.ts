import { CHECKOUT_SCHEMA } from "./checkout-schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { CATALOG_PRODUCTS } from "@/data/catalog";
import { ADMIN_USERNAME } from "@/lib/admin-credentials";

/** bcrypt hash for the requested first-run manager password: 12341234. */
const ADMIN_PASSWORD_HASH =
  "$2b$10$YAu5piv4291T1BiYxAcNGOH/qeyPCL9DPLeYaGcB1jZNZUhjENh5S";

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

/**
 * NOTE: D1's `exec()` treats every *line* as a separate statement, so multi-line
 * CREATE TABLE statements fail there. Each statement below is therefore kept as
 * one string and executed through prepare().run() inside a batch.
 */
const NOW_MS = "(CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))";

const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, username TEXT NOT NULL, password_hash TEXT NOT NULL, full_name TEXT, phone TEXT, is_admin INTEGER DEFAULT 0 NOT NULL, created_at INTEGER DEFAULT ${NOW_MS} NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, code INTEGER NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '' NOT NULL, category TEXT DEFAULT 'سایر' NOT NULL, price INTEGER NOT NULL, image_url TEXT DEFAULT '' NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL, stock INTEGER DEFAULT 0 NOT NULL, created_at INTEGER DEFAULT ${NOW_MS} NOT NULL, updated_at INTEGER DEFAULT ${NOW_MS} NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, status TEXT DEFAULT 'pending' NOT NULL, total_amount INTEGER NOT NULL, full_name TEXT NOT NULL, phone TEXT NOT NULL, delivery_method TEXT NOT NULL, address TEXT, customer_note TEXT, receipt_image TEXT NOT NULL, admin_note TEXT, telegram_status TEXT DEFAULT 'not_sent' NOT NULL, created_at INTEGER DEFAULT ${NOW_MS} NOT NULL, updated_at INTEGER DEFAULT ${NOW_MS} NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, order_id INTEGER NOT NULL, product_id INTEGER, product_name TEXT NOT NULL, product_code INTEGER NOT NULL, unit_price INTEGER NOT NULL, quantity INTEGER NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS products_code_unique ON products(code)`,
  `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
];

// Remembered per Worker isolate so the checks run once, not on every request.
const readyByDatabase = new WeakMap<D1Database, Promise<void>>();

/**
 * Older deployments may already have an `orders` table without the optional
 * customer-note column. D1/SQLite does not support `ADD COLUMN IF NOT EXISTS`,
 * so inspect the table before applying this additive change.
 */
async function ensureOptionalColumns(database: D1Database) {
  const table = await database.prepare("PRAGMA table_info(orders)").all();
  const columns = new Set(
    (table.results ?? []).map((row) => String((row as { name?: unknown }).name)),
  );
  if (!columns.has("customer_note")) {
    await database
      .prepare("ALTER TABLE orders ADD COLUMN customer_note TEXT")
      .run();
  }
}

async function ensureSchema(database: D1Database) {
  // CREATE ... IF NOT EXISTS is safe to run repeatedly and also works on a
  // database that was created by `npm run db:push`.
  await database.batch(
    [...SCHEMA_STATEMENTS, ...CHECKOUT_SCHEMA].map((statement) =>
      database.prepare(statement),
    ),
  );
  await ensureOptionalColumns(database);

  // Keep the requested manager account available after a fresh deployment.
  // The password is stored only as a bcrypt hash; the login UI displays the
  // one-time setup credential and production operators should rotate it.
  await database
    .prepare(
      "INSERT INTO users (username, password_hash, full_name, phone, is_admin) VALUES (?, ?, ?, ?, 1) ON CONFLICT(username) DO NOTHING",
    )
    .bind(
      ADMIN_USERNAME,
      ADMIN_PASSWORD_HASH,
      "مدیر فروشگاه",
      "09131147897",
    )
    .run();
  // If an older customer had already claimed the reserved username, promote it
  // once so the requested credentials work; afterwards a manager can rotate the
  // password without this bootstrap overwriting it on every request.
  await database
    .prepare(
      "UPDATE users SET password_hash=?, is_admin=1, full_name=COALESCE(full_name, ?), phone=COALESCE(phone, ?) WHERE username=? AND is_admin=0",
    )
    .bind(
      ADMIN_PASSWORD_HASH,
      "مدیر فروشگاه",
      "09131147897",
      ADMIN_USERNAME,
    )
    .run();

  // Seed the catalog once when the products table is empty, so ordering works
  // without a manual `npm run db:seed`.
  const countRow = await database
    .prepare("SELECT COUNT(*) AS n FROM products")
    .first<{ n: number }>();
  if (!countRow || Number(countRow.n) === 0) {
    const insert =
      "INSERT INTO products (code, name, description, category, price, image_url, is_active, stock) VALUES (?, ?, ?, ?, ?, ?, 1, ?) ON CONFLICT(code) DO NOTHING";
    const statements = CATALOG_PRODUCTS.map((product) =>
      database
        .prepare(insert)
        .bind(
          product.code,
          product.name,
          product.description,
          product.category,
          product.price,
          product.imageUrl,
          product.stock,
        ),
    );
    // D1 allows large batches, but keep chunks small to stay well within limits.
    for (let i = 0; i < statements.length; i += 25) {
      await database.batch(statements.slice(i, i + 25));
    }
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
        "Make sure wrangler.jsonc defines d1_naghshiran and the latest Worker deployment includes that binding.",
    );
  }

  let ready = readyByDatabase.get(env.DB);
  if (!ready) {
    ready = ensureSchema(env.DB).catch((error) => {
      readyByDatabase.delete(env.DB);
      throw error;
    });
    readyByDatabase.set(env.DB, ready);
  }
  await ready;
  return createDatabase(env.DB);
}

export async function getRawDb(): Promise<D1Database> {
  await getDb();
  return getCloudflareContext().env.DB;
}
