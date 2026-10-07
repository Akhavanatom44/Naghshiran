"use client";

import { useCart } from "@/lib/cart-context";
import { CheckIcon } from "@/components/icons";

export default function CartToast() {
  const { toast } = useCart();
  if (!toast) return null;

  return (
    <div
      key={toast.id}
      className="toast-in fixed left-1/2 z-[80] -translate-x-1/2 bottom-[calc(92px+env(safe-area-inset-bottom,0px))] md:bottom-8"
    >
      <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-[#0c2018]/95 px-5 py-2.5 text-sm font-bold text-emerald-300 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        {toast.message}
      </div>
    </div>
  );
}
