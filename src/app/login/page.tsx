"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import { LockIcon, ShieldIcon, UserIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ورود ناموفق بود");
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
      <h1 className="text-2xl font-black text-white">ورود به حساب کاربری</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        برای ثبت سفارش، ارسال فیش واریزی و پیگیری خرید خود وارد شوید.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">نام کاربری</label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field with-icon text-left"
              placeholder="username"
              dir="ltr"
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted)]">رمز عبور</label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field with-icon text-left"
              placeholder="••••••••"
              dir="ltr"
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full rounded-xl py-3.5 text-sm">
          {loading ? "در حال ورود..." : "ورود به حساب"}
        </button>
      </form>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--muted)]">
        <ShieldIcon className="h-4 w-4 text-teal-300" />
        نشست شما به‌صورت امن و رمزنگاری‌شده نگهداری می‌شود.
      </p>

      <div className="mt-6 border-t border-[rgba(148,184,220,0.14)] pt-5 text-center text-sm text-[var(--muted)]">
        حساب کاربری ندارید؟{" "}
        <Link href="/register" className="font-black text-amber-300 transition hover:text-amber-200">
          در نقشیران ثبت‌نام کنید
        </Link>
      </div>
    </AuthShell>
  );
}
