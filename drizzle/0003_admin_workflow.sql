-- Additive admin workflow fields. Existing orders and customers are preserved.
ALTER TABLE orders ADD COLUMN customer_note TEXT;
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders(status, created_at);
