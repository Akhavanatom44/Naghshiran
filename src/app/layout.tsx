import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import CartToast from "@/components/CartToast";
import Footer from "@/components/Footer";
import GlowBackground from "@/components/GlowBackground";

/* Self-hosted Vazirmatn (variable weight 100–900) — served from our own
   origin so mobile visitors never wait on a third-party font CDN. */
const vazirmatn = localFont({
  src: "../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn[wght].woff2",
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نقشیران | فروشگاه تخصصی تجهیزات نقشه‌برداری",
  description:
    "خرید آنلاین تجهیزات نقشه‌برداری در اصفهان؛ پرداخت با فیش واریزی، تأیید سریع ادمین، ارسال با پیک یا تحویل حضوری. اصفهان، خیابان استانداری، نبش خیابان فرشادی — ۰۹۳۱۱۴۷۸۹۷",
  icons: { icon: "/icon.svg", apple: "/images/profile.png" },
  openGraph: {
    title: "نقشیران | فروشگاه تخصصی تجهیزات نقشه‌برداری",
    description:
      "تجهیزات حرفه‌ای نقشه‌برداری؛ خرید امن با فیش واریزی و پشتیبانی سریع. اصفهان، خیابان استانداری، نبش خیابان فرشادی.",
    images: ["/images/profile.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="relative min-h-screen bg-[#0a1322] font-[family-name:var(--font-vazirmatn)] text-white antialiased">
        <GlowBackground />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <div className="min-h-[70vh]">{children}</div>
            <Footer />
            <MobileNav />
            <CartToast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
