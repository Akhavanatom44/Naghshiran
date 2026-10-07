"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

function formatToman(amount: number) {
  return amount.toLocaleString("fa-IR") + " تومان";
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalAmount, clearCart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();

  function goCheckout() {
    if (!loading && !user) {
      router.push("/login?next=/checkout");
      return;
    }
    router.push("/checkout");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-extrabold text-white">
        🛒 سبد <span className="gradient-text">خرید</span>
      </h1>

      {items.length === 0 ? (
        <div className="glass-card rounded-3xl p-14 text-center">
          <p className="text-5xl">🛍️</p>
          <p className="mt-4 text-violet-100/70">سبد خرید شما خالی است.</p>
          <Link href="/" className="btn-glow mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold text-white">
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="glass-card flex items-center gap-4 rounded-2xl p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-900/50 to-fuchsia-900/30">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">🛍️</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white">{item.name}</p>
                  <p className="text-xs text-cyan-300">کد {item.code.toLocaleString("fa-IR")}</p>
                  <p className="mt-1 text-sm text-violet-100/60">{formatToman(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-white">
                    {item.quantity.toLocaleString("fa-IR")}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="rounded-lg px-2 py-1 text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  حذف
                </button>
              </div>
            ))}
            <button
              onClick={clearCart}
              className="text-sm text-violet-100/50 underline-offset-2 hover:text-rose-300 hover:underline"
            >
              خالی کردن سبد خرید
            </button>
          </div>

          <div className="glass-card neon-border h-fit rounded-3xl p-6">
            <h2 className="mb-4 text-lg font-bold text-white">خلاصه سفارش</h2>
            <div className="flex items-center justify-between text-sm text-violet-100/70">
              <span>تعداد اقلام</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0).toLocaleString("fa-IR")}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
              <span>مبلغ قابل پرداخت</span>
              <span className="gradient-text">{formatToman(totalAmount)}</span>
            </div>
            <button
              onClick={goCheckout}
              className="btn-glow mt-6 w-full rounded-xl py-3 text-sm font-bold text-white"
            >
              ادامه فرایند خرید ←
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
