"use client";

import { useCart } from "@/lib/cart-context";
import { faNum } from "@/lib/format";
import { MinusIcon, PlusIcon } from "@/components/icons";

export type ProductForCard = {
  id: number;
  code: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export default function ProductCard({
  product,
  index = 0,
}: {
  product: ProductForCard;
  index?: number;
}) {
  const { addItem, updateQuantity, getQuantity, showToast } = useCart();
  const qty = getQuantity(product.id);
  const outOfStock = product.stock <= 0;

  const addOne = () => {
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
    showToast(`«${product.name}» به سبد خرید اضافه شد`);
  };

  const decOne = () => updateQuantity(product.id, qty - 1);

  return (
    <article
      className="product-card fade-in-up"
      style={{ animationDelay: `${Math.min(index, 11) * 70}ms` }}
    >
      {/* ─── white showcase stage ─── */}
      <div className="product-stage m-2 rounded-[1rem] sm:m-2.5">
        <span className="ring-anim rounded-[1rem]" />
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="mix-blend-multiply h-full w-full rounded-[1rem] object-contain p-3 sm:p-4"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl">🛍️</div>
        )}
        <span className="stage-inner-shadow rounded-[1rem]" />
        <span className="stage-shine rounded-[1rem]" />

        <span className="absolute right-2.5 top-2.5 rounded-full bg-[#0a1322]/80 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur">
          کد {faNum(product.code)}
        </span>
        {outOfStock && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-600/90 px-2.5 py-1 text-[10px] font-bold text-white">
            ناموجود
          </span>
        )}

        {/* add-to-cart: turns into a quantity stepper */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          {outOfStock ? null : qty === 0 ? (
            <button
              onClick={addOne}
              aria-label={`افزودن ${product.name} به سبد خرید`}
              className="add-btn"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          ) : (
            <div className="stepper-pill">
              <button
                onClick={addOne}
                aria-label="افزودن یک عدد"
                className="stepper-btn stepper-plus"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <span className="min-w-7 text-center text-base font-black text-white">
                {faNum(qty)}
              </span>
              <button
                onClick={decOne}
                aria-label="کاهش یک عدد"
                className="stepper-btn stepper-minus"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── info ─── */}
      <div className="space-y-1.5 px-3.5 pb-4 pt-1 sm:px-4">
        <h3 className="line-clamp-1 text-sm font-extrabold text-white sm:text-base">
          {product.name}
        </h3>
        <p className="line-clamp-2 min-h-[2.2rem] text-xs leading-5 text-[var(--muted)]">
          {product.description || "بدون توضیحات"}
        </p>
        <div className="flex items-end justify-between pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-amber-300 sm:text-lg">
              {product.price.toLocaleString("fa-IR")}
            </span>
            <span className="text-[10px] font-bold text-[var(--muted)]">تومان</span>
          </div>
          {!outOfStock && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              موجود
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
