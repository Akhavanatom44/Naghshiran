"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatToman, faNum } from "@/lib/format";
import { savePendingCartProduct } from "@/lib/cart-storage";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function CartPage() {
  const { items, ready, updateQuantity, removeItem, totalAmount, clearCart, totalCount } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();

  function goCheckout() {
    if (loading || !ready) return;
    if (!user) {
      router.push("/login?next=%2Fcheckout");
      return;
    }
    router.push("/checkout");
  }

  function increaseItem(item: (typeof items)[number]) {
    if (loading || !ready) return;
    if (!user) {
      savePendingCartProduct({
        productId: item.productId,
        code: item.code,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        stock: item.stock,
      });
      router.push("/login?next=%2Fcart");
      return;
    }
    updateQuantity(item.productId, item.quantity + 1);
  }

  if (!ready) {
    return <main className="mx-auto max-w-5xl px-4 py-24 text-center text-[var(--muted)]">در حال بارگذاری سبد خرید...</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-black text-white sm:text-2xl">
          سبد <span className="gradient-text">خرید</span>
        </h1>
        {items.length > 0 && (
          <span className="rounded-full border border-[rgba(148,184,220,0.16)] bg-white/5 px-3.5 py-1.5 text-xs font-bold text-[var(--muted)]">
            {faNum(totalCount)} کالا
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass-card fade-in-up rounded-3xl p-14 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-amber-400/10 text-amber-400">
            <CartIcon className="h-9 w-9" />
          </span>
          <p className="mt-5 font-bold text-white">سبد خرید شما خالی است</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            از ویترین محصولات، تجهیزات موردنیازتان را اضافه کنید.
          </p>
          <Link href="/#shop" className="btn-primary mt-6 inline-flex rounded-xl px-6 py-3 text-sm">
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="glass-card fade-in-up flex items-center gap-3 rounded-2xl p-3 sm:gap-4 sm:p-4"
              >
                <div className="product-stage relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="mix-blend-multiply h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">🛍️</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-white sm:text-base">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                    کد {faNum(item.code)} • {formatToman(item.price)}
                  </p>
                  <p className="mt-1 text-sm font-black text-amber-300">
                    {formatToman(item.price * item.quantity)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="stepper-pill">
                    <button
                      onClick={() => increaseItem(item)}
                      disabled={loading || item.quantity >= item.stock}
                      aria-label="افزودن یک عدد"
                      className="stepper-btn stepper-plus disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                    <span className="min-w-7 text-center text-base font-black text-white">
                      {faNum(item.quantity)}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      aria-label="کاهش یک عدد"
                      className="stepper-btn stepper-minus"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-300 transition hover:bg-rose-500/10"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={clearCart}
              className="text-xs font-bold text-[var(--muted)] underline-offset-4 transition hover:text-rose-300 hover:underline"
            >
              خالی کردن سبد خرید
            </button>
          </div>

          <div className="glass-card fade-in-up h-fit rounded-3xl p-5 sm:p-6">
            <h2 className="mb-4 text-base font-black text-white">خلاصه سفارش</h2>
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>تعداد اقلام</span>
              <span className="font-bold text-white">{faNum(totalCount)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[rgba(148,184,220,0.14)] pt-3">
              <span className="text-sm font-bold text-white">مبلغ قابل پرداخت</span>
              <span className="text-base font-black text-amber-300">{formatToman(totalAmount)}</span>
            </div>
            <button onClick={goCheckout} disabled={loading} className="btn-primary mt-6 w-full rounded-xl py-3.5 text-sm">
              ادامه فرایند خرید
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-[var(--muted)]">
              در مرحله بعد اطلاعات گیرنده و فیش واریزی را ثبت می‌کنید.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
