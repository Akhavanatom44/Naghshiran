"use client";

import { useMemo, useState } from "react";
import ProductCard, { type ProductForCard } from "@/components/ProductCard";
import { CrosshairIcon } from "@/components/icons";

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("fa")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\u200c/g, " ");
}

const ALL = "همه محصولات";
type SortOrder = "featured" | "price-ascending" | "price-descending" | "name";

export default function ProductCatalog({
  products,
}: {
  products: ProductForCard[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [sortOrder, setSortOrder] = useState<SortOrder>("featured");

  const categories = useMemo(
    () => [
      ALL,
      ...new Set(
        products
          .map((product) => product.category)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    const matches = products.filter((product) => {
      const matchesCategory =
        activeCategory === ALL || product.category === activeCategory;
      const searchable = `${product.name} ${product.description} ${product.code} ${product.category ?? ""}`;
      return (
        matchesCategory && normalizeSearch(searchable).includes(normalizedQuery)
      );
    });

    if (sortOrder === "price-ascending")
      return matches.sort((a, b) => a.price - b.price);
    if (sortOrder === "price-descending")
      return matches.sort((a, b) => b.price - a.price);
    if (sortOrder === "name")
      return matches.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    return matches;
  }, [products, query, activeCategory, sortOrder]);

  const specialOffers = products.filter(
    (product) => (product.discountPercent ?? 0) > 0 && product.stock > 0,
  );

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 sm:pt-8">
      {specialOffers.length > 0 && (
        <section
          id="special-offers"
          aria-labelledby="offers-title"
          className="special-offers mb-9 scroll-mt-24 rounded-3xl p-3 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-bold text-teal-200">
                انتخاب‌های اقتصادی نقشیران
              </p>
              <h2
                id="offers-title"
                className="text-xl font-black text-white sm:text-2xl"
              >
                تخفیفات <span className="gradient-text">ویژه</span>
              </h2>
              <p className="mt-2 text-xs text-[var(--muted)]">
                قیمت ویژه در سبد خرید و سفارش نیز اعمال می‌شود.
              </p>
            </div>
            <a
              href="#shop"
              className="btn-outline rounded-xl px-4 py-2 text-xs"
            >
              همهٔ محصولات ↓
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {specialOffers.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      )}
      <section id="shop" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-teal-200">
              <CrosshairIcon className="h-4 w-4" />
              فروشگاه تخصصی تجهیزات نقشه‌برداری نقشیران
            </p>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              محصولات <span className="gradient-text">نقشه‌برداری</span>
            </h1>
            <p className="mt-1.5 text-xs leading-6 text-[var(--muted)] sm:text-sm">
              مدل موردنظرتان را جست‌وجو کنید یا دسته‌بندی را انتخاب کنید؛ برای
              افزودن به سبد، وارد حساب شوید یا ثبت‌نام کنید.
            </p>
          </div>
          <span className="rounded-full border border-[rgba(148,184,220,0.16)] bg-white/5 px-3.5 py-1.5 text-xs font-bold text-[var(--muted)]">
            {visibleProducts.length.toLocaleString("fa-IR")} از{" "}
            {products.length.toLocaleString("fa-IR")} محصول
          </span>
        </div>

        <div className="glass-card mb-4 grid gap-3 rounded-2xl p-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-4">
          <label className="relative block">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]"
            >
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جست‌وجوی نام، مدل یا کد محصول"
              aria-label="جست‌وجوی محصولات"
              className="input-field pr-11"
            />
          </label>
          <label className="sr-only" htmlFor="catalog-sort">
            مرتب‌سازی محصولات
          </label>
          <select
            id="catalog-sort"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            className="input-field cursor-pointer"
          >
            <option value="featured">ترتیب پیش‌فرض</option>
            <option value="price-ascending">قیمت: کم به زیاد</option>
            <option value="price-descending">قیمت: زیاد به کم</option>
            <option value="name">نام محصول</option>
          </select>
        </div>

        <div
          className="mb-5 flex gap-2 overflow-x-auto pb-1"
          aria-label="دسته‌بندی محصولات"
        >
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                activeCategory === category
                  ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                  : "border-[rgba(148,184,220,0.16)] bg-white/5 text-[var(--muted)] hover:bg-white/10 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <p className="font-bold text-white">
              محصولی با این مشخصات پیدا نشد
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActiveCategory(ALL);
              }}
              className="btn-outline mt-5 rounded-xl px-5 py-2.5 text-sm"
            >
              نمایش همه محصولات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-5">
            {visibleProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
