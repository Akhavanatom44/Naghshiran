"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export type ProductForCard = {
  id: number;
  code: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
};

function formatToman(amount: number) {
  return amount.toLocaleString("fa-IR") + " تومان";
}

export default function ProductCard({ product }: { product: ProductForCard }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  return (
    <div className="group relative overflow-hidden rounded-3xl glass-card neon-border fade-in-up transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-15px_rgba(168,85,247,0.5)]">
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-violet-900/40 to-fuchsia-900/20">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl">🛍️</div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-cyan-300 backdrop-blur">
          کد {product.code.toLocaleString("fa-IR")}
        </span>
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600/90 px-3 py-1 text-xs font-bold text-white">
            ناموجود
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-bold text-white">{product.name}</h3>
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-violet-100/60">
          {product.description || "بدون توضیحات"}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-extrabold gradient-text">{formatToman(product.price)}</span>
        </div>
        <button
          disabled={outOfStock}
          onClick={() => {
            addItem(
              {
                productId: product.id,
                code: product.code,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                stock: product.stock,
              },
              1
            );
            setAdded(true);
            setTimeout(() => setAdded(false), 1400);
          }}
          className="btn-glow mt-1 w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {outOfStock ? "ناموجود" : added ? "✅ به سبد اضافه شد" : "🛒 افزودن به سبد خرید"}
        </button>
      </div>
    </div>
  );
}
