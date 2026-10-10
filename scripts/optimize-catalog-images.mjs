#!/usr/bin/env node
/** Rasterize catalog art and compress product images, without modifying originals. */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(readFileSync(path.join(root, "src/data/catalog.json"), "utf8"));
let optimized = 0;
for (const { code } of catalog) {
  const base = path.join(root, `public/images/catalog/${code}`);
  if (existsSync(`${base}.webp`)) continue;
  const source = ["png", "jpg", "svg"].find((ext) => existsSync(`${base}.${ext}`));
  if (!source) throw new Error(`Missing image for ${code}`);
  let input = `${base}.${source}`;
  if (source === "svg") {
    // More restrained product art: remove the background grid/dashed ring and
    // use soft studio gradients. Remains explicitly illustrative, not a photo.
    let svg = readFileSync(input, "utf8")
      .replace(/<rect width="800" height="800" fill="url\(#grid\)"\/>/g, "")
      .replace(/<circle cx="400" cy="406"[^>]+\/>/g, "")
      .replace(/fill="#333a42"/g, 'fill="url(#darkgrad)"')
      .replace(/fill="#424b54"/g, 'fill="url(#darkgrad)"');
    input = Buffer.from(svg);
  }
  await sharp(input).resize(640, 640, { fit: "contain", background: "#ffffff" })
    .webp({ quality: 82, effort: 6 }).toFile(`${base}.webp`);
  optimized++;
}
console.log(`Wrote ${optimized} lightweight WebP product images.`);
