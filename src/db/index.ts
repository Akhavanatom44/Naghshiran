import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type DrizzleDatabase = ReturnType<typeof drizzle>;

type SharedDatabaseState = {
  url: string;
  pool: Pool;
  db: DrizzleDatabase;
};

const globalForDb = globalThis as typeof globalThis & {
  __naghshiranDatabase?: SharedDatabaseState;
};

/**
 * Create the database connection only when a query is made.
 *
 * Next.js imports route modules during `next build` to collect route metadata.
 * Requiring DATABASE_URL at module scope made a perfectly valid build fail even
 * when no page needed to connect to PostgreSQL. Runtime requests still receive
 * a clear configuration error when the database is actually used.
 */
function getDatabase(): DrizzleDatabase {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not configured; add it to the server runtime environment.");
  }

  if (!globalForDb.__naghshiranDatabase || globalForDb.__naghshiranDatabase.url !== url) {
    const pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
    globalForDb.__naghshiranDatabase = { url, pool, db: drizzle(pool) };
  }

  return globalForDb.__naghshiranDatabase.db;
}

/** Lazy proxy: importing this module is safe during a build without DB secrets. */
export const db = new Proxy({} as DrizzleDatabase, {
  get(_target, property) {
    const database = getDatabase();
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
