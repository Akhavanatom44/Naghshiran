#!/usr/bin/env bash
# Run from the root of the Naghshiran repo:  bash fix-naghshiran.sh
set -euo pipefail

if [ ! -f package.json ]; then
  echo "package.json not found. Run this from the repo root." >&2
  exit 1
fi

echo "==> Installing OpenNext Cloudflare adapter and wrangler"
npm install @opennextjs/cloudflare@latest
npm install -D wrangler@latest

echo "==> Updating package.json scripts"
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts.build = "next build";
pkg.scripts["build:cf"] = "opennextjs-cloudflare build";
pkg.scripts.preview = "opennextjs-cloudflare build && opennextjs-cloudflare preview";
pkg.scripts.deploy = "opennextjs-cloudflare build && opennextjs-cloudflare deploy";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

echo "==> Writing open-next.config.ts"
[ -f open-next.config.ts ] && cp open-next.config.ts open-next.config.ts.bak
cat > open-next.config.ts <<'EOF'
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// buildCommand is set explicitly so OpenNext never calls "npm run build"
// recursively if that script is ever changed.
export default {
  ...defineCloudflareConfig(),
  buildCommand: "npx next build",
};
EOF

if [ -f wrangler.toml ] || [ -f wrangler.json ] || [ -f wrangler.jsonc ]; then
  echo "==> A wrangler config already exists, leaving it untouched."
  echo "    Make sure it has: main = .open-next/worker.js, assets.directory = .open-next/assets,"
  echo "    compatibility_flags includes nodejs_compat."
else
  echo "==> Writing wrangler.jsonc"
  cat > wrangler.jsonc <<'EOF'
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "naghshiran",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
EOF
fi

echo "==> Updating .gitignore"
touch .gitignore
for entry in ".open-next" ".wrangler"; do
  grep -qxF "$entry" .gitignore || echo "$entry" >> .gitignore
done

echo
echo "Done. Now run:"
echo "  git add -A"
echo "  git commit -m 'Fix Cloudflare deploy with OpenNext'"
echo "  git push"
echo
echo "Then in Cloudflare (Workers Builds > Settings > Build) set:"
echo "  Build command:  npx opennextjs-cloudflare build"
echo "  Deploy command: npx opennextjs-cloudflare deploy"
