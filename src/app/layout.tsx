import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlowBackground from "@/components/GlowBackground";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "فروشگاه نقش ایران | خرید آنلاین",
  description: "فروشگاه اینترنتی نقش ایران با پرداخت از طریق فیش واریزی و پشتیبانی تلگرامی.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="relative min-h-screen bg-[#0b0620] font-[family-name:var(--font-vazirmatn)] text-white antialiased">
        <GlowBackground />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <div className="min-h-[70vh]">{children}</div>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
