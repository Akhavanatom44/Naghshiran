#!/usr/bin/env node
/**
 * Writes src/data/catalog-images.json: a map of product code -> image path.
 * Products with a generated photo (public/images/catalog/<code>.jpg) use it;
 * the others fall back to the SVG illustration. Run after adding photos:
 *   node scripts/catalog-image-manifest.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(readFileSync(path.join(root, "src/data/catalog.json"), "utf8"));
const manifest = {};
let photos = 0;
for (const { code } of catalog) {
  const extension = ["webp", "jpg", "png", "svg"].find((ext) => existsSync(path.join(root, "public/images/catalog", `${code}.${ext}`)));
  if (!extension) throw new Error(`No image found for product ${code}`);
  if (extension !== "svg") photos++;
  manifest[code] = `/images/catalog/${code}.${extension}`;
}
writeFileSync(path.join(root, "src/data/catalog-images.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`catalog-images.json written: ${photos}/${catalog.length} products have raster images (generated or illustrated).`);
