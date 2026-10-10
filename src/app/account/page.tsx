"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import {
  LogOutIcon,
  PackageIcon,
  PhoneIcon,
  ShieldIcon,
} from "@/components/icons";
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from "@/lib/format";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { clearCart, showToast } = useCart();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user && !loggingOut)
      router.replace("/login?next=/account");
  }, [loading, user, loggingOut, router]);

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center text-[var(--muted)]">
        در حال بارگذاری...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-xl font-black text-white sm:text-2xl">
        حساب <span className="gradient-text">کاربری</span>
      </h1>

      <div className="glass-card fade-in-up rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 text-2xl font-black text-[#1c0e00] shadow-[0_12px_30px_-10px_rgba(255,122,0,0.7)]">
            {(user.fullName || user.username).slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black text-white">
              {user.fullName || user.username}
            </p>
            <p className="text-sm text-[var(--muted)]" dir="ltr">
              @{user.username}
            </p>
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="mt-1 inline-block text-xs text-[var(--muted)] transition hover:text-teal-200"
                dir="ltr"
              >
                {user.phone}
              </a>
            )}
          </div>
          {user.isAdmin && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
              <ShieldIcon className="h-3.5 w-3.5" />
              ادمین
            </span>
          )}
        </div>

        {user.isAdmin && (
          <Link
            href="/admin"
            className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-400/10 py-3.5 text-sm font-black text-amber-200 transition hover:bg-amber-400/20"
          >
            <ShieldIcon className="h-4.5 w-4.5" />
            ورود به پنل مدیریت فروشگاه
          </Link>
        )}

        <div className={`${user.isAdmin ? "mt-3" : "mt-7"} grid gap-3 sm:grid-cols-2`}>
          <Link
            href="/orders"
            className="btn-outline flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm"
          >
            <PackageIcon className="h-4.5 w-4.5 text-amber-400" />
            سفارش‌های من
          </Link>
          <a
            href={STORE_PHONE_TEL}
            className="btn-outline flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm"
          >
            <PhoneIcon className="h-4.5 w-4.5 text-teal-300" />
            <span dir="ltr">{STORE_PHONE_DISPLAY}</span>
          </a>
        </div>

        <button
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true);
            try {
              await logout();
              clearCart();
              router.replace("/");
              router.refresh();
            } catch {
              setLoggingOut(false);
              showToast("خروج انجام نشد؛ دوباره تلاش کنید");
            }
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 py-3.5 text-sm font-black text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-wait disabled:opacity-60"
        >
          <LogOutIcon className="h-4.5 w-4.5" />
          {loggingOut ? "در حال خروج..." : "خروج از حساب کاربری"}
        </button>

        <p className="mt-5 text-center text-[11px] leading-5 text-[var(--muted)]">
          فروشگاه نقشیران — اصفهان، خیابان استانداری، نبش خیابان فرشادی
        </p>
      </div>
    </main>
  );
}
