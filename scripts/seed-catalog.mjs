#!/usr/bin/env node
/**
 * Seeds the D1 database `d1_naghshiran` with the catalog in src/data/catalog.json.
 *
 * Usage:
 *   node scripts/seed-catalog.mjs --remote   # seed the real D1 database
 *   node scripts/seed-catalog.mjs --local    # seed the local (miniflare) D1
 *
 * Prices include the requested 50% increase over the source listing price.
 * Existing products with the same code are not overwritten.
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

const statements = catalog.map((product) => {
  const price = Math.round((product.sourcePrice * 150) / 100);
  const imageUrl = images[String(product.code)] ?? `/images/catalog/${product.code}.svg`;
  return (
    "INSERT INTO products (code, name, description, category, price, image_url, is_active, stock) VALUES (" +
    [
      product.code,
      `'${escapeSql(product.name)}'`,
      `'${escapeSql(product.description)}'`,
      `'${escapeSql(product.category)}'`,
      price,
      `'${imageUrl}'`,
      "1",
      "99",
    ].join(", ") +
    ") ON CONFLICT(code) DO NOTHING"
  );
});

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

console.log("Catalog seed complete. Prices include the requested 50% increase; existing records were not overwritten.");
