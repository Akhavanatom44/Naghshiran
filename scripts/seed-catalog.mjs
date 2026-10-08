import "dotenv/config";
import { Pool } from "pg";
import catalog from "../src/data/catalog.json" with { type: "json" };

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is required. Add it to .env before seeding the catalog.");
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 8_000 });
const client = await pool.connect();
let inserted = 0;

try {
  await client.query("BEGIN");
  for (const product of catalog) {
    const price = Math.round((product.sourcePrice * 150) / 100);
    const result = await client.query(
      `INSERT INTO products (code, name, description, category, price, image_url, is_active, stock)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 99)
       ON CONFLICT (code) DO NOTHING`,
      [
        product.code,
        product.name,
        product.description,
        product.category,
        price,
        `/images/catalog/${product.code}.svg`,
      ]
    );
    inserted += result.rowCount ?? 0;
  }
  await client.query("COMMIT");
  console.log(`Catalog ready: ${inserted} new products inserted; ${catalog.length - inserted} already existed.`);
  console.log("Prices include the requested 50% increase; existing records are not overwritten.");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Catalog seed failed:", error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
