-- Additive seller features. Runtime initialization also applies these changes
-- after inspecting existing columns; no seed/reset is necessary.
ALTER TABLE products ADD COLUMN discount_percent INTEGER;
ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient_id INTEGER NOT NULL REFERENCES users(id), sender_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, read_at INTEGER, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id, id);
CREATE TABLE IF NOT EXISTS product_images (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY NOT NULL, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
-- Revoke sessions issued while the legacy manager login exposed credentials.
UPDATE users SET session_version=1 WHERE is_admin=1 AND session_version=0;
