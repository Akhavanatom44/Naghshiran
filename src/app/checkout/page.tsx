"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

function formatToman(amount: number) {
  return amount.toLocaleString("fa-IR") + " تومان";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const BANK_CARD_NUMBER = "6037-9918-0000-0000";
const BANK_ACCOUNT_OWNER = "فروشگاه نقش ایران";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const { user, loading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">("ship");
  const [address, setAddress] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/checkout");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (!loading && items.length === 0) {
      router.replace("/cart");
    }
  }, [loading, items, router]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد");
      return;
    }
    setError("");
    const dataUrl = await fileToDataUrl(file);
    setReceiptPreview(dataUrl);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!receiptPreview) {
      setError("لطفاً تصویر فیش واریزی را ارسال کنید");
      return;
    }
    if (deliveryMethod === "ship" && address.trim().length < 5) {
      setError("برای ارسال با پیک، آدرس دقیق را وارد کنید");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          fullName,
          phone,
          deliveryMethod,
          address: deliveryMethod === "ship" ? address : null,
          receiptImage: receiptPreview,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ثبت سفارش با خطا مواجه شد");
        return;
      }
      clearCart();
      router.push(`/orders/${data.orderId}?submitted=1`);
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user || items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center text-violet-100/60">
        در حال بارگذاری...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-extrabold text-white">
        تکمیل <span className="gradient-text">فرایند خرید</span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={onSubmit} className="glass-card space-y-5 rounded-3xl p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-100/80">نام و نام خانوادگی گیرنده</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-100/80">شماره تلفن</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-violet-100/80">روش تحویل</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("ship")}
                className={`rounded-xl border p-4 text-right transition ${
                  deliveryMethod === "ship"
                    ? "border-fuchsia-400/70 bg-fuchsia-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="font-bold text-white">🚚 ارسال با پیک</p>
                <p className="mt-1 text-xs text-violet-100/60">هزینه پیک بر عهده مشتری است</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`rounded-xl border p-4 text-right transition ${
                  deliveryMethod === "pickup"
                    ? "border-cyan-400/70 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="font-bold text-white">🏬 تحویل حضوری</p>
                <p className="mt-1 text-xs text-violet-100/60">
                  خیابان استانداری، نبش خیابان فرشادی، فروشگاه نقش ایران
                </p>
              </button>
            </div>
          </div>

          {deliveryMethod === "ship" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-100/80">آدرس دقیق پستی</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
                placeholder="استان، شهر، خیابان، کوچه، پلاک، واحد"
              />
            </div>
          )}

          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <p className="font-bold">💳 اطلاعات واریز</p>
            <p className="mt-1">
              مبلغ <span className="font-extrabold text-white">{formatToman(totalAmount)}</span> را به
              شماره کارت <span dir="ltr" className="font-bold text-white">{BANK_CARD_NUMBER}</span> به
              نام {BANK_ACCOUNT_OWNER} واریز کرده و تصویر فیش واریزی را در ادامه بارگذاری کنید.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-violet-100/80">تصویر فیش واریزی</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full text-sm text-violet-100/70 file:ml-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-fuchsia-500 file:to-violet-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
            />
            {receiptPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={receiptPreview} alt="فیش واریزی" className="max-h-64 w-full object-contain bg-black/30" />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-glow w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "در حال ثبت سفارش..." : "ثبت نهایی سفارش و ارسال فیش"}
          </button>
        </form>

        <div className="glass-card neon-border h-fit rounded-3xl p-6">
          <h2 className="mb-4 text-lg font-bold text-white">خلاصه سبد خرید</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <span className="text-violet-100/70">
                  {item.name} × {item.quantity.toLocaleString("fa-IR")}
                </span>
                <span className="font-semibold text-white">
                  {formatToman(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
            <span>جمع کل</span>
            <span className="gradient-text">{formatToman(totalAmount)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
