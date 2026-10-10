"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_PASSWORD_LABEL, ADMIN_USERNAME } from "@/lib/admin-credentials";
import { LockIcon, ShieldIcon, UserIcon } from "@/components/icons";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState(ADMIN_USERNAME);
  const [password, setPassword] = useState(ADMIN_PASSWORD_LABEL);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "ورود ادمین ناموفق بود");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="glass-card fade-in-up rounded-3xl p-6 sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
          <ShieldIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-white">
          ورود به <span className="gradient-text">پنل مدیریت</span>
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-[var(--muted)]">
          سفارش‌ها، فیش‌های واریزی و اطلاعات تماس خریداران را مدیریت کنید.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="mb-1.5 block text-xs font-bold text-[var(--muted)]"
            >
              نام کاربری ادمین
            </label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="admin-username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="input-field with-icon text-left"
                dir="ltr"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-bold text-[var(--muted)]"
            >
              رمز عبور
            </label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="admin-password"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field with-icon text-left"
                dir="ltr"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-sm leading-6 text-rose-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full rounded-xl py-3.5 text-sm disabled:cursor-wait"
          >
            {submitting ? "در حال ورود..." : "ورود به پنل مدیریت"}
          </button>
        </form>

        <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-center text-[11px] leading-6 text-amber-100/80">
          حساب پیش‌فرض فروشگاه: <span dir="ltr" className="font-black text-amber-200">admin</span>
          <br />
          پسورد اولیه: <span dir="ltr" className="font-black text-amber-200">12341234</span>
        </p>
      </div>
    </main>
  );
}
