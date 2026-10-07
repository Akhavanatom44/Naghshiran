import { db } from "@/db";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ProductCard, { type ProductForCard } from "@/components/ProductCard";
import Link from "next/link";
import {
  CrosshairIcon,
  HeadsetIcon,
  PhoneIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/icons";
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from "@/lib/format";

export const dynamic = "force-dynamic";

/* Demo catalog shown only in development when the database is unreachable,
   so the storefront stays browsable without a live PostgreSQL instance. */
const DEMO_PRODUCTS: ProductForCard[] = [
  {
    id: 1,
    code: 1001,
    name: "توتال استیشن حرفه‌ای",
    description: "توتال استیشن دقیق با بلوتوث، حافظه داخلی و صفحه‌کلید دوزبانه",
    price: 485_000_000,
    imageUrl: "/images/products/total-station.jpg",
    stock: 4,
  },
  {
    id: 2,
    code: 1002,
    name: "گیرنده GNSS دو فرکانسه",
    description: "گیرنده ژئودتیک RTK با دقت سانتی‌متری و اتصال بی‌سیم",
    price: 390_000_000,
    imageUrl: "/images/products/gnss-receiver.jpg",
    stock: 3,
  },
  {
    id: 3,
    code: 1003,
    name: "تراز نقشه‌برداری اپتیکی",
    description: "تراز اتوماتیک ۳۲× با کمپنساتور دقیق و بدنه مقاوم",
    price: 86_500_000,
    imageUrl: "/images/products/auto-level.jpg",
    stock: 6,
  },
  {
    id: 4,
    code: 1004,
    name: "سه‌پایه چوبی نقشه‌برداری",
    description: "سه‌پایه استاندارد چوبی با قفل مطمئن و کفشک ضدلغزش",
    price: 18_800_000,
    imageUrl: "/images/products/tripod.jpg",
    stock: 10,
  },
  {
    id: 5,
    code: 1005,
    name: "ژالون منشوک‌دار",
    description: "ژالون تلسکوپی دو متری با منشوگ گرد دقیق",
    price: 24_500_000,
    imageUrl: "/images/products/prism-pole.jpg",
    stock: 8,
  },
  {
    id: 6,
    code: 1006,
    name: "متر لیزری حرفه‌ای",
    description: "فاصله‌سنج لیزری تا ۱۲۰ متر با دقت ±۱.۵ میلی‌متر",
    price: 12_900_000,
    imageUrl: "/images/products/laser-meter.jpg",
    stock: 12,
  },
];

export default async function HomePage() {
  let items: ProductForCard[] = [];
  let demoMode = false;

  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));
    items = rows.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      stock: p.stock,
    }));
  } catch (err) {
    console.warn("[home] database unavailable, using demo catalog:", err);
    if (process.env.NODE_ENV !== "production") {
      items = DEMO_PRODUCTS;
      demoMode = true;
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      {/* ─── hero ─── */}
      <section className="relative overflow-hidden px-2 pb-6 pt-12 text-center sm:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(255,138,30,0.14),transparent_60%)]" />

        <p className="fade-in-up mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-300">
          <CrosshairIcon className="h-4 w-4" />
          فروشگاه تخصصی تجهیزات نقشه‌برداری — اصفهان
        </p>

        <h1
          className="fade-in-up mx-auto max-w-3xl text-[clamp(2rem,7vw,3.9rem)] font-black leading-[1.25] text-white"
          style={{ animationDelay: "80ms" }}
        >
          تجهیزات حرفه‌ای نقشه‌برداری
          <br />
          <span className="gradient-text">از نقشیران بخواهید</span>
        </h1>

        <p
          className="fade-in-up mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base sm:leading-8"
          style={{ animationDelay: "160ms" }}
        >
          از توتال استیشن و گیرنده GNSS تا تراز و لوازم جانبی؛ محصولات را در ویترین سفید و
          صیقلی ما بررسی کنید، به سبد خرید اضافه کنید و با ارسال فیش واریزی، سفارش خود را پس از
          تأیید ادمین تحویل بگیرید.
        </p>

        <div
          className="fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Link href="#shop" className="btn-primary rounded-2xl px-7 py-3.5 text-sm">
            مشاهده محصولات
          </Link>
          <a href={STORE_PHONE_TEL} className="btn-outline rounded-2xl px-7 py-3.5 text-sm">
            <PhoneIcon className="h-4 w-4 text-teal-300" />
            <span dir="ltr">{STORE_PHONE_DISPLAY}</span>
          </a>
        </div>

        <div
          className="fade-in-up mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
          style={{ animationDelay: "320ms" }}
        >
          {[
            {
              icon: ShieldIcon,
              title: "پرداخت امن",
              desc: "ثبت فیش واریزی و تأیید توسط ادمین فروشگاه",
            },
            {
              icon: TruckIcon,
              title: "ارسال یا تحویل حضوری",
              desc: "پیک تا درب منزل یا تحویل در فروشگاه نقشیران",
            },
            {
              icon: HeadsetIcon,
              title: "پشتیبانی سریع",
              desc: "پیگیری لحظه‌ای وضعیت سفارش در همین وب‌سایت",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-4 text-right sm:p-5">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-600/20 text-amber-400">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-extrabold text-white">{f.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── products ── */}
      <section id="shop" className="mt-10 scroll-mt-24">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white sm:text-2xl">
              ویترین <span className="gradient-text">محصولات</span>
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
              روی دکمهٔ + بزنید تا محصول به سبد خرید اضافه شود
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[rgba(148,184,220,0.16)] bg-white/5 px-3.5 py-1.5 text-xs font-bold text-[var(--muted)]">
            {items.length.toLocaleString("fa-IR")} محصول
          </span>
        </div>

        {demoMode && (
          <p className="mb-4 rounded-2xl border border-teal-400/25 bg-teal-400/5 px-4 py-2.5 text-xs text-teal-200">
            حالت نمایشی: پایگاه داده در دسترس نیست و محصولات نمونه نمایش داده می‌شوند.
          </p>
        )}

        {items.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-[var(--muted)]">
            هنوز محصولی در فروشگاه ثبت نشده است. ادمین می‌تواند از طریق ربات تلگرامی محصولات را
            اضافه کند.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-5">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
