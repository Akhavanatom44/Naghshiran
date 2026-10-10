"use client";
import { useRef, useState } from "react";
import { STORE_CARD_NUMBER } from "@/lib/format";
export default function PaymentCard() {
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/payment/melli-card.svg"
        alt="کارت بانک ملی ایران برای واریز به فروشگاه نقشیران؛ شماره کارت در کادر زیر قابل کپی است"
        width={860}
        height={510}
        className="mx-auto w-full max-w-md rounded-2xl shadow-xl"
      />
      <label
        htmlFor="seller-card"
        className="mt-4 block text-xs font-bold text-amber-200"
      >
        شماره کارت بانک ملی
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id="seller-card"
          ref={input}
          readOnly
          value={STORE_CARD_NUMBER}
          dir="ltr"
          className="input-field min-w-0 flex-1 text-center font-mono text-lg tracking-wider"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className="btn-outline rounded-xl px-4 py-2 text-xs"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(STORE_CARD_NUMBER);
              setNotice("شماره کارت کپی شد.");
            } catch {
              input.current?.focus();
              input.current?.select();
              setNotice(
                "کپی خودکار ممکن نیست؛ شماره انتخاب شده است، آن را کپی کنید.",
              );
            }
          }}
        >
          کپی شماره کارت
        </button>
      </div>
      <p role="status" className="mt-1 text-xs text-emerald-200">
        {notice}
      </p>
    </div>
  );
}
