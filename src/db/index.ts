import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Cloudflare D1 database access for OpenNext.
 *
 * The D1 binding is request-scoped through the Cloudflare Worker runtime.
 * Do not keep the Drizzle client in a process/global singleton: Worker
 * isolates can be reused across requests and the binding should always come
 * from the current request's Cloudflare environment.
 */

function createDatabase(database: D1Database) {
  return drizzle(database, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

/**
 * Resolve the D1-backed database from the current Cloudflare request.
 *
 * All database consumers in this application are dynamic route handlers or
 * server functions, so the synchronous getCloudflareContext() form is the
 * appropriate OpenNext API here. Static/SSG code should use the async form.
 */
export function getDb(): Database {
  const { env } = getCloudflareContext();

  if (!env.DB) {
    throw new Error(
      "D1 binding `DB` is missing from the active Cloudflare Worker environment. " +
        "Make sure wrangler.jsonc defines the d1_naghshiran binding and that the latest Worker deployment includes it."
    );
  }

  return createDatabase(env.DB);
}
