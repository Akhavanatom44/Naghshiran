"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartIcon, CheckIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { faNum, formatToman } from "@/lib/format";

/** A persistent, compact checkout affordance after the first product is added. */
export default function CartSummaryBar() {
  const pathname = usePathname();
  const { ready, totalCount, totalAmount } = useCart();

  if (
    !ready ||
    totalCount === 0 ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null;
  }

  return (
    <aside className="cart-summary-bar" aria-label="خلاصه سبد خرید">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300 sm:h-10 sm:w-10">
            <CartIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white sm:text-sm">
              شما {faNum(totalCount)} کالا در سبد خرید دارید
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
              جمع خرید: <span className="font-black text-amber-300">{formatToman(totalAmount)}</span>
            </p>
          </div>
        </div>
        <Link
          href="/cart"
          className="btn-primary shrink-0 rounded-xl px-3.5 py-2.5 text-xs sm:px-5 sm:text-sm"
        >
          <CheckIcon className="h-4 w-4" />
          پرداخت
        </Link>
      </div>
    </aside>
  );
}
