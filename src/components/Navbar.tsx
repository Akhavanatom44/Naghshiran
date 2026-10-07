"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/", label: "فروشگاه" },
  { href: "/orders", label: "سفارش‌های من" },
];

export default function Navbar() {
  const { totalCount } = useCart();
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0620]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 text-lg font-black text-white shadow-[0_0_20px_rgba(217,70,239,0.6)]">
            نقش
          </span>
          <span className="hidden text-lg font-extrabold text-white sm:block">
            فروشگاه <span className="gradient-text">نقش ایران</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-white/10 text-white"
                  : "text-violet-100/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            🛒 سبد خرید
            {totalCount > 0 && (
              <span className="absolute -top-2 -left-2 grid h-5 w-5 place-items-center rounded-full bg-fuchsia-500 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(236,72,153,0.8)]">
                {totalCount}
              </span>
            )}
          </Link>

          {!loading && !user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-violet-100/80 hover:text-white"
              >
                ورود
              </Link>
              <Link
                href="/register"
                className="btn-glow rounded-xl px-4 py-2 text-sm font-bold text-white"
              >
                ثبت‌نام
              </Link>
            </div>
          )}

          {!loading && user && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-xl bg-white/5 px-3 py-2 text-sm text-violet-100/80">
                👋 {user.fullName || user.username}
              </span>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                  router.refresh();
                }}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                خروج
              </button>
            </div>
          )}

          <button
            className="rounded-xl border border-white/10 p-2 text-white md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="منو"
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-violet-100/80 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            {!loading && !user && (
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="btn-glow flex-1 rounded-xl px-3 py-2 text-center text-sm font-bold text-white"
                >
                  ثبت‌نام
                </Link>
              </div>
            )}
            {!loading && user && (
              <button
                onClick={async () => {
                  await logout();
                  setMenuOpen(false);
                  router.push("/");
                  router.refresh();
                }}
                className="mt-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-rose-300"
              >
                خروج ({user.fullName || user.username})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
