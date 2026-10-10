"use client";

import { usePathname } from "next/navigation";
import {
  addCartItem,
  reconcileCart,
  sanitizeCart,
  setCartQuantity,
} from "@/lib/cart-utils";
import { CART_STORAGE_KEY } from "@/lib/cart-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: number;
  code: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
};

export type CartToastState = { id: number; message: string } | null;

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
  getQuantity: (productId: number) => number;
  toast: CartToastState;
  showToast: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return sanitizeCart(value);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<CartToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Hydrate after mount (server render must stay empty to avoid a mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* Private browsing/quota: keep the in-memory cart usable. */
    }
  }, [items, hydrated]);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const refreshProducts = async () => {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.databaseConfigured === false || !Array.isArray(data.products))
          return;
        setItems((prev) =>
          reconcileCart(
            prev,
            data.products.map((p: { id: number }) => ({
              ...p,
              productId: p.id,
            })),
          ),
        );
      } catch {
        /* Keep the cart intact if the catalog is temporarily unavailable. */
      }
    };
    void refreshProducts();
    window.addEventListener("focus", refreshProducts);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refreshProducts);
    };
  }, [pathname]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => addCartItem(prev, item, quantity));
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prev) => setCartQuantity(prev, productId, quantity));
  };

  const clearCart = () => setItems([]);

  const getQuantity = (productId: number) =>
    items.find((p) => p.productId === productId)?.quantity ?? 0;

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        ready: hydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmount,
        getQuantity,
        toast,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
