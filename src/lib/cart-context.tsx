"use client";

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
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is CartItem =>
      typeof item === "object" &&
      item !== null &&
      Number.isInteger(item.productId) &&
      Number.isInteger(item.code) &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      typeof item.quantity === "number" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      typeof item.stock === "number"
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
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
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }, []);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: Math.min(p.quantity + quantity, Math.max(p.stock, 1) || 99) }
            : p
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.productId === productId
            ? { ...p, quantity: Math.min(quantity, Math.max(p.stock, 1)) }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const getQuantity = (productId: number) =>
    items.find((p) => p.productId === productId)?.quantity ?? 0;

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items]
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
