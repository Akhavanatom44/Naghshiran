"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

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
    <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-16">
      <div className="w-full glass-card neon-border rounded-3xl p-8 fade-in-up">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-white">
          ورود به <span className="gradient-text">حساب کاربری</span>
        </h1>
        <p className="mb-6 text-center text-sm text-violet-100/60">
          برای ثبت سفارش و پیگیری خرید خود وارد شوید
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-violet-100/80">نام کاربری</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
              placeholder="username"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-violet-100/80">رمز عبور</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/30"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "در حال ورود..." : "ورود"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-violet-100/60">
          حساب کاربری ندارید؟{" "}
          <Link href="/register" className="font-bold text-fuchsia-300 hover:underline">
            ثبت‌نام کنید
          </Link>
        </p>
      </div>
    </main>
  );
}
