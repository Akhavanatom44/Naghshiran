"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/Logo";
import { CartIcon, PhoneIcon, UserIcon } from "@/components/icons";
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from "@/lib/format";

const links = [
  { href: "/", label: "فروشگاه" },
  { href: "/orders", label: "سفارش‌های من" },
];

export default function Navbar() {
  const { totalCount } = useCart();
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(148,184,220,0.14)] bg-[#0a1322]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo size={42} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-lg font-black text-white sm:text-xl">نقشیران</span>
            <span className="hidden truncate text-[11px] font-medium text-[var(--muted)] sm:block">
              تجهیزات تخصصی نقشه‌برداری
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                pathname === link.href
                  ? "bg-amber-400/10 text-amber-300"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={STORE_PHONE_TEL}
            className="mr-2 hidden items-center gap-2 rounded-xl border border-[rgba(148,184,220,0.16)] bg-white/5 px-3.5 py-2 text-sm font-bold text-white transition hover:border-amber-400/50 hover:text-amber-300 lg:flex"
            dir="ltr"
          >
            <PhoneIcon className="h-4 w-4 text-amber-400" />
            {STORE_PHONE_DISPLAY}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            aria-label="سبد خرید"
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(148,184,220,0.16)] bg-white/5 text-white transition hover:border-amber-400/50 hover:text-amber-300"
          >
            <CartIcon className="h-5 w-5" />
            {totalCount > 0 && (
              <span
                key={totalCount}
                className="badge-bump absolute -top-1.5 -left-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-1 text-[11px] font-black text-[#1c0e00] shadow-[0_4px_14px_rgba(255,122,0,0.6)]"
              >
                {totalCount.toLocaleString("fa-IR")}
              </span>
            )}
          </Link>

          {/* desktop auth area */}
          <div className="hidden items-center gap-2 md:flex">
            {!loading && !user && (
              <>
                <Link href="/login" className="btn-outline rounded-xl px-4 py-2.5 text-sm">
                  ورود
                </Link>
                <Link href="/register" className="btn-primary rounded-xl px-4 py-2.5 text-sm">
                  ثبت‌نام
                </Link>
              </>
            )}
            {!loading && user && (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-xl border border-[rgba(148,184,220,0.16)] bg-white/5 px-3.5 py-2.5 text-sm font-bold text-white transition hover:border-amber-400/50"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-xs font-black text-[#1c0e00]">
                    {(user.fullName || user.username).slice(0, 1)}
                  </span>
                  {user.fullName || user.username}
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    router.push("/");
                    router.refresh();
                  }}
                  className="rounded-xl px-3 py-2.5 text-sm font-bold text-rose-300 transition hover:bg-rose-500/10"
                >
                  خروج
                </button>
              </>
            )}
          </div>

          {/* mobile account shortcut */}
          <Link
            href={user ? "/account" : "/login"}
            aria-label="حساب کاربری"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(148,184,220,0.16)] bg-white/5 text-white transition hover:text-amber-300 md:hidden"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

