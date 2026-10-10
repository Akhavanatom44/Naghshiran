/** Idempotent additions shared by lazy initialization and deployment tooling. */
export const SELLER_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient_id INTEGER NOT NULL REFERENCES users(id), sender_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, read_at INTEGER, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id, id)`,
  `CREATE TABLE IF NOT EXISTS product_images (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY NOT NULL, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL)`,
];
