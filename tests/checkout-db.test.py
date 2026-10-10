"""Exercise runtime-equivalent SQLite triggers without touching store data."""
import re
import sqlite3
import unittest
from pathlib import Path

class CheckoutTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.executescript(Path('drizzle/0000_unique_wallop.sql').read_text())
        self.db.executescript(Path('drizzle/0001_safe_checkout.sql').read_text())
        self.db.execute("INSERT INTO users(username,password_hash) VALUES ('test','hash')")
        self.db.execute("INSERT INTO products(code,name,price,stock) VALUES (212,'Tape',100,2)")
        self.db.commit()
    def submit(self, key, qty=1, price=100):
        with self.db:
            self.db.execute("INSERT INTO orders(user_id,total_amount,full_name,phone,delivery_method,receipt_image) VALUES (1,?,'test','09131147897','pickup','data')", (price*qty,))
            self.db.execute("INSERT INTO order_submissions VALUES (?,1,last_insert_rowid(),'hash')", (key,))
            self.db.execute("INSERT INTO order_items(order_id,product_id,product_name,product_code,unit_price,quantity) VALUES ((SELECT order_id FROM order_submissions WHERE request_key=?),1,'Tape',212,?,?)", (key,price,qty))
    def stock(self):
        return self.db.execute('SELECT stock FROM products').fetchone()[0]
    def test_reserve_release_once_and_rejected_terminal(self):
        self.submit('one')
        self.assertEqual(self.stock(),1)
        self.db.execute("UPDATE orders SET status='rejected'")
        self.assertEqual(self.stock(),2)
        self.db.execute("UPDATE orders SET status='rejected'")
        self.assertEqual(self.stock(),2)
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE orders SET status='approved'")
    def test_duplicate_and_stock_conflict_roll_back_entire_batch(self):
        self.submit('one')
        with self.assertRaises(sqlite3.IntegrityError): self.submit('one')
        self.assertEqual(self.stock(),1)
        with self.assertRaises(sqlite3.IntegrityError): self.submit('two',2)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM orders').fetchone()[0],1)
        self.assertEqual(self.stock(),1)
    def test_price_conflict_rolls_back(self):
        with self.assertRaises(sqlite3.IntegrityError): self.submit('one',price=-1)
        self.assertEqual(self.stock(),2)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM orders').fetchone()[0],0)
    def test_migration_matches_runtime(self):
        statements = re.findall(r'`([^`]+)`', Path('src/db/checkout-schema.ts').read_text())
        sql = Path('drizzle/0001_safe_checkout.sql').read_text()
        self.assertTrue(all(s+';' in sql for s in statements))
    def test_delete_returns_reserved_stock(self):
        self.submit('one')
        self.db.execute('DELETE FROM orders')
        self.assertEqual(self.stock(),2)


class ProductCodeMigrationTests(unittest.TestCase):
    def test_renumber_is_idempotent_and_preserves_custom_photos(self):
        db = sqlite3.connect(':memory:')
        db.executescript('''
          CREATE TABLE products (
            id INTEGER PRIMARY KEY, code INTEGER UNIQUE, description TEXT NOT NULL,
            image_url TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1
          );
          CREATE TABLE order_items (id INTEGER PRIMARY KEY, product_code INTEGER NOT NULL);
          INSERT INTO products VALUES (7, 96001, 'قدیمی', '/images/catalog/96001.webp', 1);
          INSERT INTO products VALUES (8, 96002, 'سفارشی', '/custom/photo.jpg', 1);
          INSERT INTO order_items(product_code) VALUES (96001), (96002);
        ''')
        migration = Path('drizzle/0004_product_codes.sql').read_text()
        db.executescript(migration)
        db.executescript(migration)

        self.assertEqual(
            db.execute('SELECT id, code FROM products ORDER BY id').fetchall(),
            [(7, 200), (8, 201)],
        )
        self.assertEqual(
            db.execute('SELECT image_url FROM products ORDER BY id').fetchall(),
            [('/images/catalog/200.webp',), ('/custom/photo.jpg',)],
        )
        self.assertEqual(
            db.execute('SELECT product_code FROM order_items ORDER BY id').fetchall(),
            [(200,), (201,)],
        )
        descriptions = db.execute(
            'SELECT description FROM products ORDER BY id'
        ).fetchall()
        self.assertTrue(descriptions[0][0].startswith('کد محصول: ۲۰۰'))
        self.assertTrue(descriptions[1][0].startswith('کد محصول: ۲۰۱'))


if __name__ == '__main__': unittest.main()
