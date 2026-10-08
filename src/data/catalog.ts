import rawCatalog from "./catalog.json";
import catalogImages from "./catalog-images.json";

const IMAGE_BY_CODE: Record<string, string> = catalogImages;

/** Photo (JPG) when generated, otherwise the SVG illustration. */
export function catalogImageUrl(code: number): string {
  return IMAGE_BY_CODE[String(code)] ?? `/images/catalog/${code}.svg`;
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

export const CATALOG_PRODUCTS: CatalogProduct[] = rawCatalog.map((product) => ({
  id: product.code,
  code: product.code,
  name: product.name,
  description: product.description,
  price: adjustedCatalogPrice(product.sourcePrice),
  imageUrl: catalogImageUrl(product.code),
  // Inventory quantities were not part of the supplied listing; this initial
  // sellable cap can be changed in the inventory/database independently.
  stock: 99,
  category: product.category,
}));
