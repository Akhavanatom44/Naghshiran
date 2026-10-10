"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { faNum, formatToman } from "@/lib/format";
import {
  compressReceipt,
  RECEIPT_INPUT_MAX_BYTES,
  RECEIPT_MIME_TYPES,
} from "@/lib/receipt-image";
import {
  STORE_ADDRESS,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
} from "@/lib/format";
import {
  MapPinIcon,
  PhoneIcon,
  ReceiptIcon,
  TruckIcon,
} from "@/components/icons";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, totalAmount, clearCart } = useCart();
  const { user, loading } = useAuth();

  const [fullName, setFullName] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">(
    "ship",
  );
  const [address, setAddress] = useState("");
  const [receiptPreview, setReceiptPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const completed = useRef(false);
  // Stable across a network retry/reload, but not across changed order details.
  const retryRequest = useRef<{ body: string; key: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?mode=register&next=%2Fcheckout");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!completed.current && !loading && ready && items.length === 0) {
      router.replace("/cart");
    }
  }, [loading, ready, items.length, router]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptPreview("");
    if (!RECEIPT_MIME_TYPES.includes(file.type)) {
      setError("فقط تصویر JPEG، PNG یا WebP مجاز است");
      return;
    }
    if (file.size > RECEIPT_INPUT_MAX_BYTES) {
      setError("حجم تصویر خیلی زیاد است؛ عکس دیگری انتخاب کنید");
      return;
    }
    setError("");
    setProcessingReceipt(true);
    try {
      // Phone photos are often several MB; shrink them below the D1 row cap.
      const dataUrl = await compressReceipt(file);
      setReceiptPreview(dataUrl);
    } catch (err) {
      setReceiptPreview("");
      setError(
        err instanceof Error && err.message === "too-large"
          ? "تصویر فیش بعد از فشرده‌سازی هنوز بزرگ است؛ اسکرین‌شات یا عکس کم‌حجم‌تری انتخاب کنید"
          : "خواندن تصویر انجام نشد؛ دوباره انتخاب کنید",
      );
    } finally {
      setProcessingReceipt(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || !user || !ready) return;
    setError("");

    if (!receiptPreview) {
      setError("لطفاً تصویر فیش واریزی را ارسال کنید");
      return;
    }
    if (deliveryMethod === "ship" && address.trim().length < 5) {
      setError("برای ارسال با پیک، آدرس دقیق را وارد کنید");
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        fullName: fullName ?? user.fullName ?? "",
        phone: phone ?? user.phone ?? "",
        deliveryMethod,
        address: deliveryMethod === "ship" ? address : null,
        receiptImage: receiptPreview,
        expectedTotal: totalAmount,
      };
      const body = JSON.stringify(payload);
      if (retryRequest.current?.body !== body) {
        const digest = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(body),
        );
        const fingerprint = Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
        const storageKey = `naghshiran-checkout-${user.id}`;
        let key = crypto.randomUUID();
        try {
          const previous = JSON.parse(
            window.sessionStorage.getItem(storageKey) ?? "null",
          );
          if (previous?.fingerprint === fingerprint) key = previous.key;
          window.sessionStorage.setItem(
            storageKey,
            JSON.stringify({ fingerprint, key }),
          );
        } catch {
          /* In-memory retries still work if browser storage is blocked. */
        }
        retryRequest.current = { body, key };
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          requestKey: retryRequest.current.key,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "ثبت سفارش با خطا مواجه شد");
        if (res.status === 401) router.replace("/login?next=%2Fcheckout");
        return;
      }
      completed.current = true;
      try {
        window.sessionStorage.removeItem(`naghshiran-checkout-${user.id}`);
      } catch {
        /* optional storage */
      }
      clearCart();
      router.push(`/orders/${data.orderId}?submitted=1`);
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (loading || !ready || !user || items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center text-[var(--muted)]">
        در حال بارگذاری...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-xl font-black text-white sm:text-2xl">
        تکمیل <span className="gradient-text">فرایند خرید</span>
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        اطلاعات گیرنده را وارد کنید، فیش واریزی را بارگذاری کنید و دکمهٔ خرید را
        بزنید.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={onSubmit}
          className="glass-card fade-in-up space-y-5 rounded-3xl p-5 sm:p-6 lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
                نام و نام خانوادگی گیرنده
              </label>
              <input
                required
                value={fullName ?? user.fullName ?? ""}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
                شماره تلفن
              </label>
              <input
                required
                value={phone ?? user.phone ?? ""}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                inputMode="tel"
                className="input-field text-left"
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-[var(--muted)]">
              روش تحویل
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("ship")}
                className={`rounded-2xl border p-4 text-right transition ${
                  deliveryMethod === "ship"
                    ? "border-amber-400/60 bg-amber-400/10"
                    : "border-[rgba(148,184,220,0.16)] bg-white/5 hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2 font-extrabold text-white">
                  <TruckIcon
                    className={`h-5 w-5 ${deliveryMethod === "ship" ? "text-amber-400" : "text-[var(--muted)]"}`}
                  />
                  ارسال با پیک
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-[var(--muted)]">
                  هزینه پیک بر عهده مشتری است
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`rounded-2xl border p-4 text-right transition ${
                  deliveryMethod === "pickup"
                    ? "border-teal-400/60 bg-teal-400/10"
                    : "border-[rgba(148,184,220,0.16)] bg-white/5 hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2 font-extrabold text-white">
                  <MapPinIcon
                    className={`h-5 w-5 ${deliveryMethod === "pickup" ? "text-teal-300" : "text-[var(--muted)]"}`}
                  />
                  تحویل حضوری
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-[var(--muted)]">
                  {STORE_ADDRESS}
                </span>
              </button>
            </div>
          </div>

          {deliveryMethod === "ship" && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
                آدرس دقیق پستی
              </label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="استان، شهر، خیابان، کوچه، پلاک، واحد"
              />
            </div>
          )}

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            <p className="flex items-center gap-2 font-black text-amber-300">
              <ReceiptIcon className="h-5 w-5" />
              اطلاعات واریز وجه
            </p>
            <p className="mt-2">
              برای جلوگیری از واریز به شماره‌ی نادرست، پیش از پرداخت اطلاعات
              حساب را تلفنی از فروشگاه دریافت کنید. مبلغ{" "}
              <span className="font-black text-white">
                {formatToman(totalAmount)}
              </span>{" "}
              را پس از هماهنگی واریز کرده و تصویر فیش را بارگذاری کنید.
            </p>
            <a
              href={STORE_PHONE_TEL}
              className="mt-2 inline-flex items-center gap-2 font-black text-amber-200 underline underline-offset-4"
              dir="ltr"
            >
              <PhoneIcon className="h-4 w-4" />
              {STORE_PHONE_DISPLAY}
            </a>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">
              تصویر فیش واریزی
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="block w-full cursor-pointer text-sm text-[var(--muted)] file:ml-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-gradient-to-l file:from-orange-600 file:to-amber-400 file:px-4 file:py-2.5 file:text-sm file:font-black file:text-[#1c0e00]"
            />
            {receiptPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-[rgba(148,184,220,0.2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptPreview}
                  alt="فیش واریزی"
                  className="max-h-64 w-full bg-black/30 object-contain"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || processingReceipt}
            className="btn-primary w-full rounded-xl py-4 text-sm"
          >
            {submitting
              ? "در حال ثبت سفارش..."
              : processingReceipt
                ? "در حال آماده‌سازی تصویر فیش..."
                : "ثبت نهایی خرید و ارسال فیش"}
          </button>
        </form>

        <div className="glass-card fade-in-up h-fit rounded-3xl p-5 sm:p-6">
          <h2 className="mb-4 text-base font-black text-white">
            خلاصه سبد خرید
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate text-[var(--muted)]">
                  {item.name} × {faNum(item.quantity)}
                </span>
                <span className="shrink-0 font-bold text-white">
                  {formatToman(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[rgba(148,184,220,0.14)] pt-3">
            <span className="text-sm font-black text-white">جمع کل</span>
            <span className="text-base font-black text-amber-300">
              {formatToman(totalAmount)}
            </span>
          </div>
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 p-3 text-[11px] leading-5 text-[var(--muted)]">
            <PhoneIcon className="h-4 w-4 shrink-0 text-teal-300" />
            پس از ثبت، فیش شما برای ادمین فروشگاه ارسال و پس از تأیید، نتیجه
            همین‌جا اعلام می‌شود.
          </p>
        </div>
      </div>
    </main>
  );
}
