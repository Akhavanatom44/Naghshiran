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

export function savePendingCartProduct(product: PendingCartProduct): boolean {
  try {
    window.localStorage.setItem(PENDING_PRODUCT_STORAGE_KEY, JSON.stringify(product));
    return true;
  } catch {
    return false;
  }
}
