import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * The database is Cloudflare D1 (SQLite), reached through the `DB` binding
 * declared in wrangler.jsonc. The previous node-postgres (`pg`) driver cannot
 * run on Workers: it needs raw TCP sockets, and bundling it for the edge
 * failed with `Could not resolve "pg-cloudflare"`.
 */

function createDatabase(database: D1Database) {
  return drizzle(database, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

const globalForDb = globalThis as typeof globalThis & {
  __naghshiranDatabase?: Database;
};

/**
 * Resolve the D1-backed database for the current request.
 *
 * Next.js imports route modules during `next build` to collect route metadata,
 * so the Cloudflare context is only touched when a query is actually made.
 * Importing this module stays safe during a build without bindings, and
 * runtime requests receive a clear error when the D1 binding is missing.
 */
export async function getDb(): Promise<Database> {
  if (!globalForDb.__naghshiranDatabase) {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.DB) {
      throw new Error(
        "D1 binding `DB` is not configured; check the d1_databases section of wrangler.jsonc."
      );
    }
    globalForDb.__naghshiranDatabase = createDatabase(env.DB);
  }

  return globalForDb.__naghshiranDatabase;
}
