#!/usr/bin/env node
/**
 * Writes src/data/catalog-images.json: a map of product code -> image path.
 * The optimizer creates WebP from a product photo when a JPG/PNG source exists;
 * otherwise it uses the product-specific SVG illustration or the generic
 * placeholder when a code has no local asset. Run after adding or replacing
 * images:
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
let missing = 0;

for (const { code } of catalog) {
  const imageDirectory = path.join(root, "public/images/catalog");
  const extension = ["webp", "jpg", "jpeg", "png", "svg"].find((ext) =>
    existsSync(path.join(imageDirectory, `${code}.${ext}`)),
  );

  const hasPhotoSource = ["jpg", "jpeg", "png"].some((ext) =>
    existsSync(path.join(imageDirectory, `${code}.${ext}`)),
  );
  if (hasPhotoSource) photos++;
  else if (extension) illustrations++;
  else missing++;

  // Keep the catalog usable even when a newly-added DB product has no local
  // asset yet. ProductImage still attempts a custom URL first, then this
  // generic local placeholder and never renders a broken-image icon.
  manifest[code] = extension
    ? `/images/catalog/${code}.${extension}`
    : "/images/catalog/placeholder.svg";
}

if (missing > 0) {
  console.warn(`Warning: ${missing} catalog product(s) use the generic placeholder image.`);
}

writeFileSync(
  path.join(root, "src/data/catalog-images.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `catalog-images.json written: ${catalog.length} products covered (${photos} with photo sources, ${illustrations} with illustrative fallbacks, ${missing} with generic placeholders).`,
);
