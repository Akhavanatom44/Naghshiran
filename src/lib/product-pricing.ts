import offers from "@/data/special-offers.json";
import { catalogImageUrl } from "@/data/catalog";

const discounts = new Map(offers.map((offer) => [offer.code, offer.percent]));

/** The same calculation is used by the catalog, cart refresh and order API. */
export function sellingPrice(code: number, basePrice: number): number {
  const percent = discounts.get(code) ?? 0;
  return Math.round((basePrice * (100 - percent)) / 100);
}

export function presentProduct<
  T extends { code: number; price: number; imageUrl: string },
>(product: T) {
  const discountPercent = discounts.get(product.code) ?? 0;
  // Replace old seeded schematic URLs, but preserve custom merchant photos.
  const imageUrl =
    !product.imageUrl ||
    /^\/images\/catalog\/\d+\.(svg|jpg|png|webp)$/.test(product.imageUrl)
      ? catalogImageUrl(product.code)
      : product.imageUrl;
  return {
    ...product,
    imageUrl,
    originalPrice: discountPercent ? product.price : undefined,
    discountPercent,
    price: sellingPrice(product.code, product.price),
  };
}
