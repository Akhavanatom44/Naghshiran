import { defineConfig } from "drizzle-kit";

// The app runs on Cloudflare D1 (SQLite). Migrations are generated locally and
// applied to D1 with `npm run db:push` / `npm run db:push:local`
// (see scripts/apply-d1-schema.mjs).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
});
