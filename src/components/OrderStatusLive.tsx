"use client";

import { useEffect, useState } from "react";
import { CheckIcon, HeadsetIcon } from "@/components/icons";

type Props = {
  orderId: number;
  initialStatus: string;
  initialNote: string | null;
};

/**
 * Keeps the order status fresh after the bank receipt is submitted.
 * The Telegram bot flips the status in the shared database when an admin
 * approves/rejects; this component polls and surfaces the result live,
 * including the green "approved by admins" announcement.
 */
export default function OrderStatusLive({ orderId, initialStatus, initialNote }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (status !== "pending") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.order && data.order.status !== status) {
          setStatus(data.order.status);
          setNote(data.order.adminNote ?? null);
        }
      } catch {
        // transient network errors: keep polling
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [status, orderId]);

  if (status === "approved") {
    return (
      <div className="success-banner mt-5 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 p-5">
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-400/25 text-emerald-300">
            <CheckIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-black text-emerald-300">تبریک! خرید شما تأیید شد</p>
            <p className="mt-1.5 text-sm leading-7 text-emerald-100/90">
              خرید شما توسط ادمین‌های ما تأیید شد و به‌زودی با شما تماس خواهند گرفت.
            </p>
            {note && (
              <p className="mt-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-xs leading-6 text-emerald-100/80">
                پیام فروشگاه: {note}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="pop-in mt-5 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-5 text-sm leading-7 text-rose-200">
        <p className="font-black">متأسفانه سفارش شما رد شد.</p>
        {note && <p className="mt-1.5">دلیل رد سفارش: {note}</p>}
        <p className="mt-1.5 text-rose-200/80">
          برای رفع مشکل با پشتیبانی فروشگاه تماس بگیرید.
        </p>
      </div>
    );
  }

  return (
    <div className="pulse-soft mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
      <div className="flex items-start gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-400/20 text-amber-300">
          <span className="spin-slow grid h-5 w-5 place-items-center">
            <span className="h-5 w-5 rounded-full border-2 border-amber-300 border-t-transparent" />
          </span>
        </span>
        <div>
          <p className="text-sm font-black text-amber-200">فیش واریزی در حال بررسی است</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs leading-6 text-amber-100/70">
            <HeadsetIcon className="h-4 w-4 shrink-0" />
            ادمین‌های نقشیران در حال بررسی فیش شما هستند؛ به‌محض تأیید، همین صفحه پیام سبز تأیید را
            نشان می‌دهد (به‌روزرسانی خودکار).
          </p>
        </div>
      </div>
    </div>
  );
}
