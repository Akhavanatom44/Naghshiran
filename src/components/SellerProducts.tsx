"use client";
import { useEffect, useState, type FormEvent } from "react";
import ProductImage from "./ProductImage";
import {
  compressReceipt,
  RECEIPT_INPUT_MAX_BYTES,
  RECEIPT_MIME_TYPES,
} from "@/lib/receipt-image";
import { faNum, formatToman } from "@/lib/format";
import { sellingPrice } from "@/lib/product-pricing";

type Product = {
  id?: number;
  code: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  discountPercent: number;
  isActive: boolean;
  updatedAt?: string;
};
const empty: Product = {
  code: 0,
  name: "",
  description: "",
  category: "سایر",
  price: 0,
  stock: 1,
  imageUrl: "",
  discountPercent: 0,
  isActive: true,
};
export default function SellerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Product | null>(null);
  const [original, setOriginal] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [discount, setDiscount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت محصولات انجام نشد");
    } finally {
      setLoading(false);
    }
  }
  // Initial request sets loading state while synchronizing with the server.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  const normalizedQuery = query
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .trim()
    .toLowerCase();
  const filtered = products.filter((p) =>
    `${p.code} ${p.name} ${p.category}`.toLowerCase().includes(normalizedQuery),
  );
  function edit(p: Product) {
    setDraft({ ...p });
    setOriginal({ ...p });
    setDiscount(p.discountPercent > 0);
    setError("");
    setNotice("");
  }
  function change(patch: Partial<Product>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft || busy || uploading) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/products", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          discountPercent: discount ? draft.discountPercent : 0,
          expectedUpdatedAt: original?.updatedAt,
          expectedStock: original?.stock,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(null);
      setOriginal(null);
      setNotice("محصول ذخیره شد و تغییرات در فروشگاه قابل مشاهده است.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره انجام نشد");
    } finally {
      setBusy(false);
    }
  }
  async function remove(p: Product) {
    if (
      busy ||
      !window.confirm(
        `«${p.name}» با کد ${p.code} از فروشگاه حذف شود؟ سابقه سفارش‌ها حفظ می‌شود و می‌توانید محصول را دوباره فعال کنید.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(null);
      setNotice("محصول از فروشگاه حذف و در فهرست غیرفعال بایگانی شد.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف انجام نشد");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">مدیریت محصولات</h2>
          <p className="mt-2 text-xs text-slate-400">
            {faNum(products.length)} محصول • قیمت، تصویر، تخفیف و موجودی در
            اختیار شماست.
          </p>
        </div>
        <button
          className="btn-primary rounded-xl px-5 py-3"
          disabled={busy || uploading}
          onClick={() =>
            edit({
              ...empty,
              code: Math.max(199, ...products.map((p) => p.code)) + 1,
            })
          }
        >
          افزودن محصول
        </button>
      </div>
      <div className="mt-5 flex gap-2">
        <input
          aria-label="جست‌وجوی محصول با کد یا نام"
          className="input-field"
          placeholder="کد محصول، نام یا دسته‌بندی را جست‌وجو کنید..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={() => void load()}
          disabled={loading}
          className="btn-outline shrink-0 rounded-xl px-3 text-xs"
        >
          تازه‌سازی
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          {notice}
        </p>
      )}
      {draft && (
        <form
          onSubmit={save}
          className="glass-card mt-6 space-y-4 rounded-3xl p-5 sm:p-7"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg">
              {draft.id ? `ویرایش محصول • ${faNum(draft.code)}` : "محصول جدید"}
            </h3>
            <button
              type="button"
              disabled={busy || uploading}
              onClick={() => setDraft(null)}
              className="text-sm text-slate-400"
            >
              بستن فرم ×
            </button>
          </div>
          <fieldset
            disabled={busy || uploading}
            className="grid gap-4 sm:grid-cols-2 disabled:opacity-60"
          >
            <label className="text-sm">
              کد یکتای محصول *
              <input
                type="number"
                required
                min={1}
                max={999999999}
                value={draft.code || ""}
                onChange={(e) => change({ code: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </label>
            <label className="text-sm">
              نام محصول *
              <input
                required
                minLength={2}
                maxLength={200}
                value={draft.name}
                onChange={(e) => change({ name: e.target.value })}
                className="input-field mt-2"
              />
            </label>
            <label className="text-sm">
              قیمت پایه (تومان) *
              <input
                type="number"
                required
                min={1}
                max={1_000_000_000_000}
                value={draft.price || ""}
                onChange={(e) => change({ price: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </label>
            <label className="text-sm">
              موجودی *
              <input
                type="number"
                required
                min={0}
                max={1_000_000}
                value={draft.stock}
                onChange={(e) => change({ stock: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </label>
            <label className="text-sm">
              دسته‌بندی *
              <input
                required
                maxLength={64}
                value={draft.category}
                onChange={(e) => change({ category: e.target.value })}
                className="input-field mt-2"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => change({ isActive: e.target.checked })}
              />
              نمایش در فروشگاه (فعال)
            </label>
            <label className="text-sm sm:col-span-2">
              جزئیات و توضیحات محصول *
              <textarea
                required
                maxLength={5000}
                rows={4}
                value={draft.description}
                onChange={(e) => change({ description: e.target.value })}
                className="input-field mt-2"
              />
            </label>
            <div className="space-y-3 rounded-2xl bg-emerald-400/5 p-4 sm:col-span-2">
              <label className="flex items-center gap-3 text-sm font-bold text-emerald-200">
                <input
                  type="checkbox"
                  checked={discount}
                  onChange={(e) => {
                    setDiscount(e.target.checked);
                    if (e.target.checked && !draft.discountPercent)
                      change({ discountPercent: 10 });
                  }}
                />
                این محصول تخفیف دارد
              </label>
              {discount && (
                <label className="block text-sm">
                  درصد تخفیف (۱ تا ۹۹)
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={draft.discountPercent}
                    onChange={(e) =>
                      change({ discountPercent: Number(e.target.value) })
                    }
                    className="input-field mt-2"
                  />
                </label>
              )}
              <p className="text-sm">
                قیمت فروش:{" "}
                <strong className="text-emerald-200">
                  {formatToman(
                    sellingPrice(
                      draft.code,
                      draft.price,
                      discount ? draft.discountPercent : 0,
                    ),
                  )}
                </strong>
              </p>
            </div>
            <div className="space-y-3 sm:col-span-2">
              <label className="block text-sm">
                تصویر محصول *
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-3 block w-full text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (
                      !RECEIPT_MIME_TYPES.includes(file.type) ||
                      file.size > RECEIPT_INPUT_MAX_BYTES
                    ) {
                      setError("فقط JPEG، PNG یا WebP تا ۱۵ مگابایت مجاز است");
                      return;
                    }
                    setUploading(true);
                    setError("");
                    try {
                      const image = await compressReceipt(file, 350_000);
                      const res = await fetch("/api/admin/images", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      change({ imageUrl: data.imageUrl });
                    } catch {
                      setError(
                        "بارگذاری عکس انجام نشد؛ یک تصویر کم‌حجم‌تر انتخاب و دوباره تلاش کنید",
                      );
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
              <label className="block text-xs text-slate-400">
                یا نشانی تصویر (HTTPS)
                <input
                  required
                  maxLength={2048}
                  value={draft.imageUrl}
                  onChange={(e) => change({ imageUrl: e.target.value })}
                  dir="ltr"
                  className="input-field mt-2"
                />
              </label>
              {draft.imageUrl && (
                <ProductImage
                  code={draft.code}
                  name={draft.name}
                  imageUrl={draft.imageUrl}
                  className="h-40 w-40 rounded-xl bg-white object-contain"
                />
              )}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy || uploading}
              className="btn-primary rounded-xl px-6 py-3"
            >
              {uploading
                ? "در حال بارگذاری عکس..."
                : busy
                  ? "در حال ذخیره..."
                  : "ثبت محصول"}
            </button>
            {draft.id && draft.isActive && (
              <button
                type="button"
                disabled={busy || uploading}
                onClick={() => void remove(draft)}
                className="rounded-xl border border-rose-400/30 px-5 py-3 text-sm text-rose-200"
              >
                حذف محصول
              </button>
            )}
          </div>
        </form>
      )}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p role="status" className="p-8 text-center text-slate-400">
            در حال دریافت محصولات...
          </p>
        ) : !filtered.length ? (
          <p className="p-8 text-center text-slate-400">محصولی پیدا نشد.</p>
        ) : (
          filtered.map((p) => (
            <article
              key={p.id}
              className="glass-card flex flex-wrap items-center gap-4 rounded-2xl p-4"
            >
              <ProductImage
                code={p.code}
                name={p.name}
                imageUrl={p.imageUrl}
                className="h-16 w-16 rounded-xl bg-white object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-amber-200">
                  کد {faNum(p.code)} {!p.isActive && "• غیرفعال / حذف‌شده"}
                </p>
                <h3 className="mt-1 text-sm font-bold">{p.name}</h3>
                <p className="mt-2 text-xs text-slate-400">
                  {formatToman(
                    sellingPrice(p.code, p.price, p.discountPercent),
                  )}{" "}
                  • موجودی {faNum(p.stock)}{" "}
                  {p.discountPercent > 0 &&
                    `• ${faNum(p.discountPercent)}٪ تخفیف`}
                </p>
              </div>
              <button
                disabled={busy || uploading}
                onClick={() => {
                  edit(p);
                  window.scrollTo({ top: 160, behavior: "smooth" });
                }}
                className="btn-outline rounded-xl px-4 py-2 text-xs"
              >
                ویرایش{!p.isActive && " / بازیابی"}
              </button>
              {p.isActive && (
                <button
                  disabled={busy || uploading}
                  onClick={() => void remove(p)}
                  className="rounded-xl bg-rose-400/10 px-4 py-2 text-xs text-rose-200"
                >
                  حذف
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
