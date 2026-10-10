export const CART_STORAGE_KEY = "naghsh-iran-cart";
export const PENDING_PRODUCT_STORAGE_KEY = "naghshiran-pending-cart-item";

export type PendingCartProduct = {
  productId: number;
  code: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export function isCartProduct(value: unknown): value is PendingCartProduct {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Partial<PendingCartProduct>;
  return (
    Number.isSafeInteger(p.productId) &&
    (p.productId ?? 0) > 0 &&
    Number.isSafeInteger(p.code) &&
    (p.code ?? 0) > 0 &&
    typeof p.name === "string" &&
    Number.isSafeInteger(p.price) &&
    (p.price ?? -1) >= 0 &&
    Number.isSafeInteger(p.stock) &&
    (p.stock ?? 0) > 0 &&
    typeof p.imageUrl === "string"
  );
}

/** Tab-scoped and short-lived: a different tab/login cannot add an old click. */
export function savePendingCartProduct(product: PendingCartProduct): boolean {
  try {
    window.sessionStorage.setItem(
      PENDING_PRODUCT_STORAGE_KEY,
      JSON.stringify({
        code: product.code,
        createdAt: Date.now(),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function pendingProductCode(): number | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_PRODUCT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (
      !Number.isSafeInteger(value.code) ||
      value.code <= 0 ||
      !Number.isFinite(value.createdAt) ||
      Date.now() - value.createdAt > 30 * 60 * 1000 ||
      value.createdAt > Date.now()
    ) {
      clearPendingProduct();
      return null;
    }
    return value.code;
  } catch {
    clearPendingProduct();
    return null;
  }
}

export function clearPendingProduct() {
  try {
    window.sessionStorage.removeItem(PENDING_PRODUCT_STORAGE_KEY);
  } catch {
    /* optional storage */
  }
  // Discard the previous release's indefinite, cross-tab pending click.
  try {
    window.localStorage.removeItem(PENDING_PRODUCT_STORAGE_KEY);
  } catch {
    /* optional storage */
  }
}
