"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import { LockIcon, PhoneIcon, ShieldIcon, UserIcon } from "@/components/icons";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ username: "", password: "", fullName: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ثبت‌نام ناموفق بود");
        return;
      }
      await refresh();
      router.push("/");
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-black text-white">ساخت حساب کاربری</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        با یک حساب رسمی در نقشیران، خرید و پیگیری سفارش‌هایتان را آغاز کنید.
      </p>

      <form onSubmit={onSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">نام و نام خانوادگی</label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="input-field with-icon"
              placeholder="مثلاً علی رضایی"
              autoComplete="name"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">شماره تلفن</label>
          <div className="relative">
            <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="input-field with-icon text-left"
              placeholder="09xxxxxxxxx"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">نام کاربری</label>
          <input
            required
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="input-field text-left"
            placeholder="فقط حروف انگلیسی و عدد"
            dir="ltr"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">رمز عبور</label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="input-field with-icon text-left"
              placeholder="حداقل ۶ کاراکتر"
              dir="ltr"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          {error && (
            <p className="mb-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full rounded-xl py-3.5 text-sm">
            {loading ? "در حال ثبت‌نام..." : "ثبت‌نام و ورود به فروشگاه"}
          </button>
        </div>
      </form>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--muted)]">
        <ShieldIcon className="h-4 w-4 text-teal-300" />
        اطلاعات شما تنها برای پردازش سفارش استفاده می‌شود.
      </p>

      <div className="mt-6 border-t border-[rgba(148,184,220,0.14)] pt-5 text-center text-sm text-[var(--muted)]">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="font-black text-amber-300 transition hover:text-amber-200">
          وارد شوید
        </Link>
      </div>
    </AuthShell>
  );
}
