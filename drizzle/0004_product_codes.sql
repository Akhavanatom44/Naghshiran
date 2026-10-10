-- Data migration: product codes move from the old 96xxx series to the compact
-- series that starts at 200 (200, 201, 202, ...). Nothing is dropped and every
-- statement is safe to run more than once.
-- Remember to re-run `npm run db:seed` afterwards so descriptions and images
-- are refreshed for the new codes.

-- 1. Move the products themselves. 96001 -> 200, 96002 -> 201, ... , 96050 -> 249.
-- A partially completed retry can already contain the destination row; retain
-- the legacy row for foreign keys but hide it from the storefront.
UPDATE products
   SET is_active = 0
 WHERE code BETWEEN 96001 AND 96050
   AND EXISTS (
         SELECT 1 FROM products AS other WHERE other.code = products.code - 95801
       );
--> statement-breakpoint
UPDATE products
   SET code = code - 95801
 WHERE code BETWEEN 96001 AND 96050
   AND NOT EXISTS (
         SELECT 1 FROM products AS other WHERE other.code = products.code - 95801
       );
--> statement-breakpoint

-- 2. Keep already-placed order lines pointing at the same products.
UPDATE order_items
   SET product_code = product_code - 95801
 WHERE product_code BETWEEN 96001 AND 96050;
--> statement-breakpoint

-- 3. Point every renumbered product at its optimized local photo.
UPDATE products
   SET image_url = '/images/catalog/' || CAST(code AS TEXT) || '.webp'
 WHERE code BETWEEN 200 AND 249
   AND (image_url = '' OR image_url GLOB '/images/catalog/*');
--> statement-breakpoint

-- 4. Product codes are no longer printed on the photo; they are appended to the
--    description instead (Persian digits, same wording as src/data/catalog.ts).
UPDATE products
   SET description = 'کد محصول: ' ||
       REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
         CAST(code AS TEXT),
         '0', '۰'), '1', '۱'), '2', '۲'), '3', '۳'), '4', '۴'),
         '5', '۵'), '6', '۶'), '7', '۷'), '8', '۸'), '9', '۹') ||
       CASE WHEN TRIM(description) = '' THEN '' ELSE ' — ' || TRIM(description) END
 WHERE code BETWEEN 200 AND 249
   AND description NOT LIKE '%کد محصول%';
