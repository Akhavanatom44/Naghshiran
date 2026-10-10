#!/usr/bin/env node
/** Rasterize catalog art and compress product images, without modifying originals. */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(
  readFileSync(path.join(root, "src/data/catalog.json"), "utf8"),
);
let optimized = 0;

for (const { code } of catalog) {
  const base = path.join(root, `public/images/catalog/${code}`);
  const output = `${base}.webp`;
  // Prefer actual generated/vendor raster photography over the SVG illustration.
  const source = ["jpg", "jpeg", "png", "svg"].find((ext) =>
    existsSync(`${base}.${ext}`),
  );

  if (!source) {
    if (existsSync(output)) continue;
    throw new Error(`Missing image for ${code}`);
  }

  let input = `${base}.${source}`;
  if (source === "svg") {
    // More restrained product art: remove the background grid/dashed ring and
    // use soft studio gradients. Remains explicitly illustrative, not a photo.
    const svg = readFileSync(input, "utf8")
      .replace(/<rect width="800" height="800" fill="url\(#grid\)"\/>/g, "")
      .replace(/<circle cx="400" cy="406"[^>]+\/>/g, "")
      .replace(/fill="#333a42"/g, 'fill="url(#darkgrad)"')
      .replace(/fill="#424b54"/g, 'fill="url(#darkgrad)"');
    input = Buffer.from(svg);
  }

  // Always rebuild so a newly added/updated photo replaces any older WebP art;
  // relying on timestamps is unsafe because Git checkouts normalize file times.
  await sharp(input)
    .resize(640, 640, { fit: "contain", background: "#ffffff" })
    .webp({ quality: 82, effort: 6 })
    .toFile(output);
  optimized++;
}

console.log(`Wrote ${optimized} lightweight WebP catalog images.`);
