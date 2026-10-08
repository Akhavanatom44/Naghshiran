#!/usr/bin/env node
/**
 * Applies the SQL migrations in ./drizzle to the D1 database `d1_naghshiran`.
 *
 * Usage:
 *   node scripts/apply-d1-schema.mjs --remote   # apply to the real D1 database
 *   node scripts/apply-d1-schema.mjs --local    # apply to the local (miniflare) D1
 *
 * Generate new migration files after changing src/db/schema.ts with:
 *   npm run db:generate
 */
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
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

const migrationsDir = path.join(rootDir, "drizzle");
let files;
try {
  files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
} catch {
  files = [];
}

if (files.length === 0) {
  console.error("No .sql migrations found in drizzle/. Run `npm run db:generate` first.");
  process.exit(1);
}

for (const file of files) {
  const filePath = path.join("drizzle", file);
  console.log(`Applying ${filePath} to d1_naghshiran (${remote ? "remote" : "local"})...`);
  const result = spawnSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "d1_naghshiran",
      remote ? "--remote" : "--local",
      "--file",
      filePath,
    ],
    { stdio: "inherit", cwd: rootDir, shell: process.platform === "win32" }
  );
  if (result.status !== 0) {
    console.error(`Failed to apply ${filePath}.`);
    process.exit(result.status ?? 1);
  }
}

console.log(`Schema applied: ${files.length} migration file(s) executed.`);
