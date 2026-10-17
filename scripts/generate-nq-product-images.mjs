#!/usr/bin/env node
/**
 * Generates the shop images for the NQ-001..NQ-008 total stations.
 *
 * Spec (see src/data/catalog.json entries with `sku`):
 *   - Pure white (#FFFFFF) background, no props, no people, no watermark,
 *     no text overlay. The only lettering is the brand name printed on the
 *     instrument body itself.
 *   - Square canvas, product fills ~80-85%, centred, soft contact shadow.
 *   - 3 views per product: main (3/4 front), side, box (with standard
 *     in-box accessories: hard case, battery, charger, tribrach, cables).
 *   - Files: public/images/products/<SKU>/<SKU>_<view>.png  (2000x2000 master)
 *            public/images/products/<SKU>/<SKU>_<view>.webp (1000x1000 web)
 *            public/images/products/<SKU>/<SKU>_<view>.jpg  (500x500 thumb)
 *   - The `main` view is also written to the catalog slots the storefront
 *     uses: public/images/catalog/<code>.svg + <code>.jpg (run
 *     `npm run catalog:optimize` afterwards for the 640px WebP).
 *
 * Colours are matched to the real instruments:
 *   Leica TS06 family  - sage green body, off-white side covers (shop photo)
 *   Leica TCR Power    - older all-green TPS400 body
 *   SANDING Arc5/Pro   - green body, white display panel, green keys
 *   Nikon NPL-350/332  - teal/turquoise standards, light-grey centre panel
 *
 * Usage: node scripts/generate-nq-product-images.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(
  readFileSync(path.join(root, "src/data/catalog.json"), "utf8"),
);
const products = catalog.filter((p) => p.sku);

const PALETTES = {
  leica: {
    body: "#a9c09e", bodyDark: "#87a37a", side: "#eef1ea", panel: "#a9c09e",
    keys: "#2f3a30", fKeys: "#f2c230", brand: "Leica",
  },
  leicaOld: {
    body: "#9db48f", bodyDark: "#7d9670", side: "#9db48f", panel: "#9db48f",
    keys: "#2f3a30", fKeys: "#d9b62e", brand: "Leica",
  },
  sanding: {
    body: "#84a874", bodyDark: "#67865a", side: "#e8eae4", panel: "#f4f6f2",
    keys: "#3f7a35", fKeys: "#5da24f", brand: "SANDING",
  },
  nikon: {
    body: "#17a2b1", bodyDark: "#0f7e8c", side: "#dfe5e1", panel: "#17a2b1",
    keys: "#17323a", fKeys: "#17a2b1", brand: "Nikon",
  },
};

function paletteFor(product) {
  if (product.brand === "Nikon") return PALETTES.nikon;
  if (product.brand === "SANDING") return PALETTES.sanding;
  if (product.model.startsWith("TCR")) return PALETTES.leicaOld;
  return PALETTES.leica;
}

const lens = `
  <defs>
    <radialGradient id="lensG" cx=".35" cy=".3" r=".9">
      <stop offset="0" stop-color="#7dd3e8"/><stop offset=".3" stop-color="#31597a"/>
      <stop offset=".65" stop-color="#131c2e"/><stop offset="1" stop-color="#05070c"/>
    </radialGradient>
    <linearGradient id="screenG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8f1f2"/><stop offset="1" stop-color="#b9ccd1"/>
    </linearGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>`;

function keypad(p, x, y, w) {
  const keyR = w * 0.028;
  let keys = "";
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 3; col++)
      keys += `<circle cx="${x + col * w * 0.075}" cy="${y + row * w * 0.075}" r="${keyR}" fill="#f4f6f2" stroke="${p.keys}" stroke-width="3"/>`;
  let fkeys = "";
  for (let i = 0; i < 4; i++)
    fkeys += `<rect x="${x - w * 0.42 + i * w * 0.11}" y="${y + w * 0.30}" width="${w * 0.085}" height="${w * 0.045}" rx="${w * 0.02}" fill="${p.fKeys}" stroke="${p.keys}" stroke-width="2"/>`;
  return keys + fkeys +
    `<circle cx="${x + w * 0.075}" cy="${y + w * 0.34}" r="${w * 0.05}" fill="${p.keys}"/>`;
}

/** Front (main) view of the instrument, drawn in a 1000x1000 box. */
function frontInstrument(p, product) {
  return `
  <ellipse cx="500" cy="905" rx="305" ry="30" fill="#233648" opacity=".14" filter="url(#soft)"/>
  <path d="M385 92 q115 -62 230 0 l0 62 -230 0 z" fill="${p.bodyDark}"/>
  <path d="M368 78 h264 v96 h-44 v-52 h-176 v52 h-44 z" fill="${p.body}"/>
  <path d="M292 250 q0 -78 78 -78 h260 q78 0 78 78 v360 q0 58 -58 66 h-300 q-58 -8 -58 -66 z" fill="${p.body}"/>
  <path d="M292 258 q0 -72 34 -80 v428 q0 40 20 62 l-28 8 q-26 -12 -26 -66 z" fill="${p.side}"/>
  <path d="M708 258 q0 -72 -34 -80 v428 q0 40 -20 62 l28 8 q26 -12 26 -66 z" fill="${p.side}"/>
  <rect x="352" y="216" width="296" height="248" rx="26" fill="${p.bodyDark}"/>
  <rect x="368" y="232" width="264" height="150" rx="18" fill="${p.body}"/>
  <circle cx="500" cy="330" r="96" fill="#14181d" stroke="#3a4249" stroke-width="8"/>
  <circle cx="500" cy="330" r="76" fill="url(#lensG)"/>
  <circle cx="500" cy="330" r="30" fill="#0a121e" stroke="#6b93a8" stroke-width="5"/>
  <circle cx="478" cy="306" r="12" fill="#bfe9ff" opacity=".75"/>
  ${product.features?.includes("EGL")
    ? `<circle cx="612" cy="252" r="13" fill="#ff3b30" stroke="#fff" stroke-width="4"/><circle cx="612" cy="252" r="26" fill="#ff3b30" opacity=".22"/>`
    : ""}
  <rect x="382" y="398" width="236" height="86" rx="12" fill="${p.side}"/>
  <circle cx="316" cy="520" r="34" fill="#22282e"/><circle cx="684" cy="520" r="34" fill="#22282e"/>
  <rect x="238" y="612" width="524" height="218" rx="20" fill="${p.panel}" stroke="${p.bodyDark}" stroke-width="5"/>
  <rect x="268" y="642" width="252" height="128" rx="10" fill="url(#screenG)" stroke="#7d929a" stroke-width="4"/>
  ${keypad(p, 596, 652, 420)}
  <text x="500" y="586" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#31402f" letter-spacing="2">${p.brand}</text>
  <path d="M330 838 h340 l42 58 h-424 z" fill="#39424a"/>
  <ellipse cx="500" cy="898" rx="218" ry="24" fill="#2b333b"/>
  <circle cx="392" cy="872" r="22" fill="#171c21"/><circle cx="608" cy="872" r="22" fill="#171c21"/>`;
}

/** Side view: horizontal telescope, eyepiece, knobs and side display. */
function sideInstrument(p, product) {
  return `
  <ellipse cx="500" cy="905" rx="315" ry="30" fill="#233648" opacity=".14" filter="url(#soft)"/>
  <path d="M392 118 q108 -56 216 0 v54 h-216 z" fill="${p.body}"/>
  <path d="M330 300 q0 -66 66 -66 h208 q66 0 66 66 v300 q0 52 -52 60 h-236 q-52 -8 -52 -60 z" fill="${p.body}"/>
  <path d="M330 308 q0 -58 30 -66 v352 q0 34 18 54 l-24 6 q-24 -10 -24 -54 z" fill="${p.side}"/>
  <rect x="196" y="318" width="470" height="128" rx="52" fill="${p.bodyDark}"/>
  <rect x="238" y="340" width="330" height="84" rx="36" fill="${p.body}"/>
  <ellipse cx="212" cy="382" rx="42" ry="62" fill="#14181d" stroke="#3a4249" stroke-width="7"/>
  <ellipse cx="212" cy="382" rx="24" ry="42" fill="url(#lensG)"/>
  <path d="M648 348 h84 q34 0 34 34 t-34 34 h-84 z" fill="#22282e"/>
  <circle cx="782" cy="382" r="26" fill="#14181d"/>
  ${product.features?.includes("EGL")
    ? `<circle cx="430" cy="306" r="14" fill="#ff3b30" stroke="#fff" stroke-width="4"/><circle cx="430" cy="306" r="30" fill="#ff3b30" opacity=".22"/><path d="M416 306 h-150" stroke="#ff3b30" stroke-width="5" stroke-dasharray="14 12" opacity=".65"/>`
    : ""}
  <circle cx="690" cy="520" r="40" fill="#22282e"/><circle cx="352" cy="520" r="30" fill="#22282e"/>
  <rect x="428" y="486" width="270" height="168" rx="16" fill="${p.panel}" stroke="${p.bodyDark}" stroke-width="5" transform="rotate(4 563 570)"/>
  <rect x="450" y="510" width="140" height="84" rx="8" fill="url(#screenG)" stroke="#7d929a" stroke-width="4" transform="rotate(4 563 570)"/>
  ${keypad(p, 640, 516, 300)}
  <text x="500" y="282" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#31402f" letter-spacing="2">${p.brand}</text>
  <path d="M340 664 h320 l42 58 h-404 z" fill="#39424a"/>
  <ellipse cx="500" cy="726" rx="208" ry="22" fill="#2b333b"/>
  <circle cx="408" cy="700" r="20" fill="#171c21"/><circle cx="592" cy="700" r="20" fill="#171c21"/>`;
}

/** Box view: instrument with its standard in-box accessories. */
function boxScene(p, product) {
  return `
  <ellipse cx="500" cy="912" rx="360" ry="30" fill="#233648" opacity=".13" filter="url(#soft)"/>
  <rect x="86" y="452" width="330" height="392" rx="30" fill="#3c454e" stroke="#20262c" stroke-width="8"/>
  <rect x="112" y="482" width="278" height="300" rx="16" fill="#4a555f"/>
  <path d="M196 452 v-34 q0 -30 32 -30 h48 q32 0 32 30 v34" fill="none" stroke="#20262c" stroke-width="18"/>
  <rect x="126" y="600" width="52" height="64" rx="10" fill="${p.bodyDark}"/>
  <rect x="324" y="600" width="52" height="64" rx="10" fill="${p.bodyDark}"/>
  <text x="251" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#dfe7dc" letter-spacing="2">${p.brand}</text>
  <g transform="translate(300 40) scale(.78)">${frontInstrument(p, product)}</g>
  <rect x="742" y="636" width="104" height="164" rx="14" fill="#2f6db3" stroke="#1d3f66" stroke-width="5"/>
  <rect x="758" y="660" width="72" height="52" rx="6" fill="#eef4f7"/>
  <path d="M770 636 v-22 h44 v22" fill="#22282e"/>
  <rect x="742" y="824" width="150" height="82" rx="14" fill="#333c44"/>
  <circle cx="782" cy="865" r="12" fill="#46d19b"/><circle cx="852" cy="865" r="12" fill="${p.fKeys}"/>
  <path d="M818 824 q60 -44 118 -10" fill="none" stroke="#22282e" stroke-width="9"/>
  <path d="M104 872 q70 -34 132 0 q-66 26 -132 0" fill="#39424a"/>
  <ellipse cx="170" cy="872" rx="72" ry="16" fill="#2b333b"/>`;
}

function svgFor(product, view) {
  const p = paletteFor(product);
  const art = view === "side" ? sideInstrument(p, product)
    : view === "box" ? boxScene(p, product)
    : frontInstrument(p, product);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
<rect width="1000" height="1000" fill="#ffffff"/>${lens}${art}</svg>`;
}

for (const product of products) {
  const dir = path.join(root, "public/images/products", product.sku);
  mkdirSync(dir, { recursive: true });
  for (const view of ["main", "side", "box"]) {
    const svg = Buffer.from(svgFor(product, view));
    const base = path.join(dir, `${product.sku}_${view}`);
    await sharp(svg).resize(2000, 2000).png().toFile(`${base}.png`);
    await sharp(svg).resize(1000, 1000).webp({ quality: 88, effort: 6 }).toFile(`${base}.webp`);
    await sharp(svg).resize(500, 500).jpeg({ quality: 88 }).toFile(`${base}.jpg`);
    if (view === "main") {
      writeFileSync(path.join(root, `public/images/catalog/${product.code}.svg`), svgFor(product, view));
      await sharp(svg).resize(1024, 1024).jpeg({ quality: 90 }).toFile(
        path.join(root, `public/images/catalog/${product.code}.jpg`),
      );
    }
  }
  console.log(`${product.sku} (code ${product.code}): main/side/box written`);
}
console.log(`Done: ${products.length} products x 3 views (PNG 2000 + WebP 1000 + JPG 500).`);
