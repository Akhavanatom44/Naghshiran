"use client";
import { useEffect, useState } from "react";
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from "@/lib/format";
type Message = {
  id: number;
  body: string;
  createdAt: number;
  readAt: number | null;
};
export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [opened, setOpened] = useState<number | null>(null);
  async function load(before?: number) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/messages${before ? `?before=${before}` : ""}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((old) =>
        before ? [...old, ...data.messages] : data.messages,
      );
      setMore(data.messages.length === 50);
      window.dispatchEvent(new Event("messages-read"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت پیام‌ها ممکن نشد");
    } finally {
      setLoading(false);
    }
  }
  // Initial request sets loading state while synchronizing with the server.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  async function open(m: Message) {
    setOpened(m.id === opened ? null : m.id);
    if (m.readAt) return;
    try {
      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id }),
      });
      if (!res.ok) throw new Error();
      setMessages((old) =>
        old.map((row) =>
          row.id === m.id ? { ...row, readAt: Date.now() } : row,
        ),
      );
      window.dispatchEvent(new Event("messages-read"));
    } catch {
      setError("وضعیت خواندن ذخیره نشد؛ پیام را دوباره باز کنید.");
    }
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">پیام‌های من</h1>
        <button
          disabled={loading}
          onClick={() => void load()}
          className="btn-outline rounded-xl px-4 py-2 text-xs"
        >
          تازه‌سازی
        </button>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-400">
        پیام‌ها و هماهنگی‌های فروشنده نقشیران درباره خرید شما، فقط برای شما
        نمایش داده می‌شوند.
      </p>
      {error && (
        <p role="alert" className="mt-5 text-sm text-rose-200">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-4">
        {messages.map((m) => (
          <article
            key={m.id}
            className={`glass-card overflow-hidden rounded-2xl ${!m.readAt ? "border-emerald-400/40" : ""}`}
          >
            <button
              onClick={() => void open(m)}
              aria-expanded={opened === m.id}
              className="w-full p-5 text-right"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-black text-emerald-200">
                  فروشنده نقشیران
                </span>
                {!m.readAt && (
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    پیام جدید
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(m.createdAt).toLocaleString("fa-IR")}
              </p>
              <p className="mt-3 truncate text-sm">{m.body}</p>
              <span className="mt-2 block text-xs text-amber-200">
                {opened === m.id ? "بستن پیام ↑" : "مشاهده پیام ↓"}
              </span>
            </button>
            {opened === m.id && (
              <div className="border-t border-white/10 p-5">
                <p className="whitespace-pre-wrap break-words text-sm leading-8">
                  {m.body}
                </p>
                <a
                  href={STORE_PHONE_TEL}
                  className="mt-5 inline-block text-xs text-amber-200"
                >
                  تماس با فروشنده برای پیگیری:{" "}
                  <b dir="ltr">{STORE_PHONE_DISPLAY}</b>
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
      {loading && (
        <p role="status" className="p-8 text-center">
          در حال دریافت پیام‌ها...
        </p>
      )}
      {!loading && !error && !messages.length && (
        <p className="glass-card mt-6 rounded-2xl p-10 text-center text-slate-400">
          هنوز پیامی از فروشنده ندارید.
        </p>
      )}
      {more && (
        <button
          disabled={loading}
          onClick={() => void load(messages.at(-1)?.id)}
          className="btn-outline mt-6 rounded-xl px-5 py-3"
        >
          پیام‌های قدیمی‌تر
        </button>
      )}
    </main>
  );
}
