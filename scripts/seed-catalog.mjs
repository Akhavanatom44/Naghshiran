#!/usr/bin/env node
/**
 * Seeds the D1 database `d1_naghshiran` with the catalog in src/data/catalog.json.
 *
 * Usage:
 *   node scripts/seed-catalog.mjs --remote   # seed the real D1 database
 *   node scripts/seed-catalog.mjs --local    # seed the local (miniflare) D1
 *
 * Prices include the requested 50% increase over the source listing price.
 * Existing products with the same code keep their price and stock; only the
 * name, description, category and image are refreshed.
 */
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const remote = args.includes("--remote");
const local = args.includes("--local");

if (remote === local) {
  console.error("Pass exactly one of --remote or --local.");
  process.exit(1);
}

const catalog = JSON.parse(readFileSync(path.join(rootDir, "src/data/catalog.json"), "utf8"));
const images = JSON.parse(readFileSync(path.join(rootDir, "src/data/catalog-images.json"), "utf8"));

const escapeSql = (value) => String(value).replaceAll("'", "''");

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
/** Persian digits, matching faNum() in src/lib/format.ts. */
const faNum = (value) =>
  String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);

/**
 * Product codes are not printed on the product photo any more; they belong to
 * the description text. Keep this wording identical to `withProductCode()` in
 * src/data/catalog.ts so the catalog and the database agree.
 */
const withProductCode = (description, code) => {
  const base = String(description ?? "").trim();
  if (!base) return `کد محصول: ${faNum(code)}`;
  if (base.includes("کد محصول")) return base;
  return `کد محصول: ${faNum(code)} — ${base}`;
};

// Migrate an already-seeded database without changing product IDs. The two
// guarded statements also make a partially-completed retry safe.
const migrationStatements = catalog.flatMap((product, index) => {
  const oldCode = 96001 + index;
  return [
    `UPDATE products SET is_active = 0 WHERE code = ${oldCode} AND EXISTS (SELECT 1 FROM products AS current WHERE current.code = ${product.code})`,
    `UPDATE products SET code = ${product.code} WHERE code = ${oldCode} AND NOT EXISTS (SELECT 1 FROM products AS current WHERE current.code = ${product.code})`,
  ];
});
migrationStatements.push(
  "UPDATE order_items SET product_code = product_code - 95801 WHERE product_code BETWEEN 96001 AND 96050",
);

const productStatements = catalog.map((product) => {
  const price = Math.round((product.sourcePrice * 150) / 100);
  const imageUrl = images[String(product.code)] ?? `/images/catalog/${product.code}.svg`;
  const description = withProductCode(product.description, product.code);
  return (
    "INSERT INTO products (code, name, description, category, price, image_url, is_active, stock) VALUES (" +
    [
      product.code,
      `'${escapeSql(product.name)}'`,
      `'${escapeSql(description)}'`,
      `'${escapeSql(product.category)}'`,
      price,
      `'${imageUrl}'`,
      "1",
      "99",
    ].join(", ") +
    // Re-seeding must refresh built-in metadata without resetting a live price,
    // reserved stock, active status or a custom merchant photo.
    ") ON CONFLICT(code) DO UPDATE SET name = excluded.name, description = excluded.description, category = excluded.category, image_url = CASE WHEN products.image_url = '' OR products.image_url GLOB '/images/catalog/*' THEN excluded.image_url ELSE products.image_url END"
  );
});

const statements = [...migrationStatements, ...productStatements];

const tmpDir = mkdtempSync(path.join(tmpdir(), "naghshiran-seed-"));
const sqlFile = path.join(tmpDir, "seed.sql");
writeFileSync(sqlFile, statements.join(";\n") + ";\n", "utf8");

console.log(`Seeding ${catalog.length} products into d1_naghshiran (${remote ? "remote" : "local"})...`);
const result = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "d1_naghshiran", remote ? "--remote" : "--local", "--file", sqlFile],
  { stdio: "inherit", cwd: rootDir, shell: process.platform === "win32" }
);
rmSync(tmpDir, { recursive: true, force: true });

if (result.status !== 0) {
  console.error("Catalog seed failed.");
  process.exit(result.status ?? 1);
}

console.log("Catalog seed complete. Prices include the requested 50% increase; the text and image of existing products were refreshed while their price and stock were kept.");
