import { isCartProduct, type PendingCartProduct } from "./cart-storage";
export type StoredCartItem = PendingCartProduct & { quantity: number };

export function sanitizeCart(value: unknown): StoredCartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value
    .filter((item): item is StoredCartItem => {
      if (
        !isCartProduct(item) ||
        !Number.isSafeInteger((item as StoredCartItem).quantity) ||
        (item as StoredCartItem).quantity <= 0 ||
        seen.has(item.productId)
      )
        return false;
      seen.add(item.productId);
      return true;
    })
    .map((item) => ({
      ...item,
      quantity: Math.min(item.quantity, item.stock, 99),
    }));
}

export function addCartItem(
  items: StoredCartItem[],
  item: PendingCartProduct,
  quantity = 1,
): StoredCartItem[] {
  if (!isCartProduct(item) || !Number.isSafeInteger(quantity) || quantity <= 0)
    return items;
  const existing = items.find((p) => p.productId === item.productId);
  const next = {
    ...item,
    quantity: Math.min((existing?.quantity ?? 0) + quantity, item.stock, 99),
  };
  return existing
    ? items.map((p) => (p.productId === item.productId ? next : p))
    : [...items, next];
}

export function setCartQuantity(
  items: StoredCartItem[],
  productId: number,
  quantity: number,
): StoredCartItem[] {
  if (!Number.isSafeInteger(quantity)) return items;
  return items
    .map((p) =>
      p.productId === productId
        ? { ...p, quantity: Math.min(quantity, p.stock, 99) }
        : p,
    )
    .filter((p) => p.quantity > 0);
}

export function reconcileCart(
  items: StoredCartItem[],
  products: (PendingCartProduct & { canPurchase?: boolean })[],
): StoredCartItem[] {
  const byCode = new Map(products.map((p) => [p.code, p]));
  return items.flatMap((item) => {
    const current = byCode.get(item.code);
    if (!current || current.canPurchase === false || !isCartProduct(current))
      return [];
    return [
      { ...current, quantity: Math.min(item.quantity, current.stock, 99) },
    ];
  });
}
