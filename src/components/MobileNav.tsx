"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { CartIcon, GridIcon, HomeIcon, PackageIcon, UserIcon } from "@/components/icons";

export default function MobileNav() {
  const { totalCount } = useCart();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const items = [
    { href: "/", label: "خانه", icon: HomeIcon, active: pathname === "/" },
    { href: "/#shop", label: "محصولات", icon: GridIcon, active: false },
    { href: "/cart", label: "سبد خرید", icon: CartIcon, active: pathname === "/cart", badge: totalCount },
    { href: "/orders", label: "سفارش‌ها", icon: PackageIcon, active: pathname.startsWith("/orders") },
    {
      href: loading ? "/login" : user ? "/account" : "/login",
      label: loading ? "حساب" : user ? "حساب من" : "ورود",
      icon: UserIcon,
      active: pathname === "/account" || pathname === "/login" || pathname === "/register",
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(148,184,220,0.16)] bg-[#0a1322]/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="ناوبری موبایل"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.label + item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition ${
              item.active ? "text-amber-400" : "text-[var(--muted)] active:text-white"
            }`}
          >
            <span className="relative">
              <item.icon className="h-[22px] w-[22px]" />
              {!!item.badge && (
                <span
                  key={item.badge}
                  className="badge-bump absolute -top-1.5 -left-2 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-1 text-[10px] font-black text-[#1c0e00]"
                >
                  {item.badge.toLocaleString("fa-IR")}
                </span>
              )}
            </span>
            {item.label}
            <span
              className={`absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-l from-amber-400 to-orange-600 transition-opacity ${
                item.active ? "opacity-100" : "opacity-0"
              }`}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
}
