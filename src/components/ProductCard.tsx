"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { faNum } from "@/lib/format";
import { savePendingCartProduct } from "@/lib/cart-storage";
import ProductImage from "@/components/ProductImage";
import { MinusIcon, PlusIcon } from "@/components/icons";

export type ProductForCard = {
  id: number;
  code: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category?: string;
  canPurchase?: boolean;
  originalPrice?: number;
  discountPercent?: number;
};

export default function ProductCard({
  product,
  index = 0,
}: {
  product: ProductForCard;
  index?: number;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    addItem,
    updateQuantity,
    getQuantity,
    showToast,
    ready: cartReady,
  } = useCart();
  const qty = getQuantity(product.id);
  const outOfStock = product.stock <= 0;
  const canPurchase = product.canPurchase !== false;
  const atStockLimit = qty >= Math.min(product.stock, 99);

  const addOne = () => {
    if (!canPurchase) {
      showToast(
        "برای فعال‌سازی خرید، ابتدا کاتالوگ را به پایگاه داده متصل کنید",
      );
      return;
    }
    if (authLoading || !cartReady || outOfStock || atStockLimit) return;

    if (!user) {
      savePendingCartProduct({
        productId: product.id,
        code: product.code,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      });
      // The query string is a fallback if sessionStorage is blocked or cleared.
      // The post-auth handler re-fetches price and stock from the server.
      router.push(`/login?next=%2F&add=${product.code}`);
      return;
    }

    addItem(
      {
        productId: product.id,
        code: product.code,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      1,
    );
    showToast(`«${product.name}» به سبد خرید اضافه شد`);
  };

  const decOne = () => updateQuantity(product.id, qty - 1);

  return (
    <article
      className="product-card fade-in-up"
      style={{ animationDelay: `${Math.min(index, 11) * 55}ms` }}
    >
      <div className="product-stage m-2 rounded-[1rem] sm:m-2.5">
        <span className="ring-anim rounded-[1rem]" />
        <ProductImage
          code={product.code}
          name={product.name}
          imageUrl={product.imageUrl}
          loading={index < 8 ? "eager" : "lazy"}
          className="mix-blend-multiply h-full w-full rounded-[1rem] object-contain p-2.5 sm:p-3.5"
        />
        <span className="stage-inner-shadow rounded-[1rem]" />
        <span className="stage-shine rounded-[1rem]" />

        {product.category && (
          <span className="absolute bottom-2.5 right-2.5 max-w-[62%] truncate rounded-full border border-slate-200/70 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-slate-600 shadow-sm">
            {product.category}
          </span>
        )}
        {!outOfStock && Boolean(product.discountPercent) && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-black text-white">
            {faNum(product.discountPercent!)}٪ تخفیف
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-600/90 px-2.5 py-1 text-[10px] font-bold text-white">
            ناموجود
          </span>
        )}
      </div>

      <div className="space-y-1.5 px-3.5 pb-4 pt-1 sm:px-4">
        <h3 className="line-clamp-2 min-h-[2.7rem] text-sm font-extrabold leading-5 text-white sm:text-base sm:leading-6">
          {product.name}
        </h3>
        <p className="text-[9px] text-[var(--muted)]">
          تصویر نمایشی؛ ظاهر دقیق را پیش از خرید تأیید کنید
        </p>
        {/* The product code is part of the description text instead of an
            overlay on the photo; three lines keep it readable. */}
        <p className="line-clamp-3 min-h-[2.2rem] text-xs leading-5 text-[var(--muted)]">
          {product.description || "بدون توضیحات"}
        </p>
        <div className="flex min-h-14 items-end justify-between gap-2 pb-2 pt-2">
          <div className="min-w-0">
            {product.originalPrice && (
              <del
                className="block text-xs text-[var(--muted)]"
                aria-label="قیمت قبل از تخفیف"
              >
                {faNum(product.originalPrice)}
              </del>
            )}
            <span className="whitespace-nowrap text-[15px] font-black text-amber-300 sm:text-lg">
              {faNum(product.price)}
            </span>
          </div>
          <span className="pb-1 text-xs font-bold text-[var(--muted)]">
            تومان
          </span>
        </div>
        {qty === 0 ? (
          <button
            onClick={addOne}
            disabled={outOfStock || !canPurchase || authLoading || !cartReady}
            aria-label={`خرید محصول ${product.name}`}
            title={
              !user
                ? "برای خرید، ابتدا وارد شوید یا ثبت‌نام کنید"
                : "افزودن به سبد خرید"
            }
            className="purchase-button w-full rounded-xl py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {outOfStock ? "ناموجود" : "خرید محصول"}
          </button>
        ) : (
          <div
            className="flex w-full items-center justify-between rounded-xl border border-emerald-400/35 bg-emerald-400/10 p-1"
            role="group"
            aria-label={`تعداد ${product.name}`}
          >
            <button
              onClick={addOne}
              disabled={
                !canPurchase ||
                authLoading ||
                !cartReady ||
                atStockLimit ||
                outOfStock
              }
              aria-label={`افزودن یک عدد ${product.name}`}
              className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400/20 text-emerald-200 disabled:opacity-30"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            <span
              aria-live="polite"
              className="text-base font-black text-emerald-100"
            >
              {faNum(qty)}
            </span>
            <button
              onClick={decOne}
              disabled={!cartReady}
              aria-label={`کاهش یک عدد ${product.name}`}
              className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-slate-200"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
