"use client";
import { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import SellerProducts from "./SellerProducts";
import SellerMessages from "./SellerMessages";

export default function SellerPanel() {
  const [tab, setTab] = useState("orders");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <p className="text-xs font-bold text-emerald-300">
          فضای اختصاصی فروشنده
        </p>
        <h1 className="mt-2 text-2xl font-black">پنل فروشگاه نقشیران</h1>
        <nav
          aria-label="بخش‌های پنل فروشگاه"
          className="mt-5 flex flex-wrap gap-2 border-b border-white/10 pb-4"
        >
          {[
            ["orders", "سفارش‌ها و فیش‌ها"],
            ["products", "مدیریت محصولات"],
            ["messages", "پیام به مشتری"],
            ["security", "امنیت حساب"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${tab === key ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/40" : "bg-white/5 text-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      {tab === "orders" && <AdminDashboard />}
      {tab === "products" && <SellerProducts />}
      {tab === "messages" && <SellerMessages />}
      {tab === "security" && (
        <main className="mx-auto max-w-xl px-4 py-8">
          <form
            className="glass-card space-y-4 rounded-2xl p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              const form = e.currentTarget;
              const values = new FormData(form);
              if (values.get("password") !== values.get("confirm")) {
                setNotice("تکرار رمز با رمز جدید یکسان نیست");
                return;
              }
              setBusy(true);
              setNotice("");
              try {
                const res = await fetch("/api/admin/password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    current: values.get("current"),
                    password: values.get("password"),
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                form.reset();
                setNotice("رمز تغییر کرد. نشست‌های قبلی فروشنده باطل شدند.");
              } catch (err) {
                setNotice(
                  err instanceof Error ? err.message : "ارتباط برقرار نشد",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2 className="font-black text-lg">تغییر رمز فروشنده</h2>
            <p className="text-sm leading-7 text-amber-200">
              رمز اولیه ساده است. برای جلوگیری از دسترسی دیگران، همین حالا یک
              رمز طولانی و منحصربه‌فرد انتخاب کنید. تغییر رمز، ورودهای قبلی را
              باطل می‌کند.
            </p>
            <label className="block text-sm">
              رمز فعلی
              <input
                name="current"
                type="password"
                autoComplete="current-password"
                required
                className="input-field mt-2"
              />
            </label>
            <label className="block text-sm">
              رمز جدید (حداقل ۱۲ نویسه)
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={72}
                required
                className="input-field mt-2"
              />
            </label>
            <label className="block text-sm">
              تکرار رمز جدید
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                className="input-field mt-2"
              />
            </label>
            <p role="status" className="text-sm text-amber-200">
              {notice}
            </p>
            <button
              disabled={busy}
              className="btn-primary w-full rounded-xl py-3"
            >
              {busy ? "در حال ذخیره..." : "تغییر رمز"}
            </button>
          </form>
        </main>
      )}
    </>
  );
}
