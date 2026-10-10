#!/usr/bin/env node
/**
 * Writes src/data/catalog-images.json: a map of product code -> image path.
 * The optimizer creates WebP from a product photo when a JPG/PNG source exists;
 * otherwise it uses the product-specific SVG illustration. Run after adding
 * or replacing images:
 *   npm run catalog:optimize
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(
  readFileSync(path.join(root, "src/data/catalog.json"), "utf8"),
);
const manifest = {};
let photos = 0;
let illustrations = 0;

for (const { code } of catalog) {
  const imageDirectory = path.join(root, "public/images/catalog");
  const extension = ["webp", "jpg", "jpeg", "png", "svg"].find((ext) =>
    existsSync(path.join(imageDirectory, `${code}.${ext}`)),
  );
  if (!extension) throw new Error(`No image found for product ${code}`);

  const hasPhotoSource = ["jpg", "jpeg", "png"].some((ext) =>
    existsSync(path.join(imageDirectory, `${code}.${ext}`)),
  );
  if (hasPhotoSource) photos++;
  else illustrations++;

  manifest[code] = `/images/catalog/${code}.${extension}`;
}

writeFileSync(
  path.join(root, "src/data/catalog-images.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `catalog-images.json written: ${catalog.length} products covered (${photos} with photo sources, ${illustrations} with illustrative fallbacks).`,
);
