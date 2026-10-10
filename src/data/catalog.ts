import rawCatalog from "./catalog.json";
import catalogImages from "./catalog-images.json";
import { faNum } from "@/lib/format";

const IMAGE_BY_CODE: Record<string, string> = catalogImages;

/** Optimized product photo when available, otherwise the local catalog illustration. */
export const CATALOG_PLACEHOLDER_IMAGE = "/images/catalog/placeholder.svg";

export function catalogImageUrl(code: number): string {
  return IMAGE_BY_CODE[String(code)] ?? CATALOG_PLACEHOLDER_IMAGE;
}

/** Every supplied listing included a listing age, so its source price receives the requested 50% update. */
export const CATALOG_MARKUP_PERCENT = 50;

export type CatalogEntry = (typeof rawCatalog)[number];
export type CatalogProduct = {
  id: number;
  code: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
};

export function adjustedCatalogPrice(sourcePrice: number): number {
  return Math.round((sourcePrice * (100 + CATALOG_MARKUP_PERCENT)) / 100);
}

/**
 * Product codes are no longer stamped onto the product photo. They are part of
 * the description text instead, so the code stays searchable and visible in
 * the card, the cart, the order summary and the admin tables.
 *
 * The same wording is produced by scripts/seed-catalog.mjs for the database.
 */
export function withProductCode(description: string, code: number): string {
  const base = (description ?? "").trim();
  if (!base) return `کد محصول: ${faNum(code)}`;
  if (base.includes("کد محصول")) return base;
  // Put the code first so it remains visible even when a compact card clamps a
  // long description to a few lines.
  return `کد محصول: ${faNum(code)} — ${base}`;
}

export const CATALOG_PRODUCTS: CatalogProduct[] = rawCatalog.map((product) => ({
  id: product.code,
  code: product.code,
  name: product.name,
  description: withProductCode(product.description, product.code),
  price: adjustedCatalogPrice(product.sourcePrice),
  imageUrl: catalogImageUrl(product.code),
  // Inventory quantities were not part of the supplied listing; this initial
  // sellable cap can be changed in the inventory/database independently.
  stock: 99,
  category: product.category,
}));
