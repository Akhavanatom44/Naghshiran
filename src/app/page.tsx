import { db } from "@/db";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt));

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <section className="relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(236,72,153,0.25),transparent_60%)]" />
        <p className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold tracking-wide text-cyan-300">
          ✨ خرید امن با پرداخت فیش واریزی
        </p>
        <h1 className="mx-auto max-w-3xl text-[clamp(2.2rem,6vw,4rem)] font-black leading-tight text-white">
          به فروشگاه <span className="gradient-text">نقش ایران</span> خوش آمدید
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-violet-100/70 sm:text-lg">
          بهترین محصولات را انتخاب کنید، سبد خریدتان را تکمیل کنید، فیش واریزی خود را ارسال
          کنید و منتظر تأیید سریع ادمین از طریق ربات تلگرام باشید.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="#shop" className="btn-glow rounded-2xl px-7 py-3 text-sm font-bold text-white">
            مشاهده محصولات 🛍️
          </Link>
          <Link
            href="/orders"
            className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            پیگیری سفارش 📦
          </Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: "🔒", title: "پرداخت امن", desc: "ثبت فیش واریزی و تأیید توسط ادمین" },
            { icon: "🚚", title: "ارسال یا حضوری", desc: "پیک تا درب منزل یا تحویل در فروشگاه" },
            { icon: "🤖", title: "پشتیبانی تلگرامی", desc: "پیگیری لحظه‌ای وضعیت سفارش" },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-5">
              <div className="mb-2 text-3xl">{f.icon}</div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="mt-1 text-xs text-violet-100/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="shop" className="mt-16 scroll-mt-24">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-white">
            🛒 محصولات <span className="gradient-text">فروشگاه</span>
          </h2>
          <span className="text-sm text-violet-100/60">
            {items.length.toLocaleString("fa-IR")} محصول موجود
          </span>
        </div>

        {items.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-violet-100/60">
            هنوز محصولی در فروشگاه ثبت نشده است. ادمین می‌تواند از طریق ربات تلگرامی محصولات
            را اضافه کند.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  code: p.code,
                  name: p.name,
                  description: p.description,
                  price: p.price,
                  imageUrl: p.imageUrl,
                  stock: p.stock,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
