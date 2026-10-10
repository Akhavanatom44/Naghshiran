"use client";
import { useEffect, useState } from "react";
type Message = {
  id: number;
  username: string;
  body: string;
  createdAt: number;
  readAt: number | null;
};
export default function SellerMessages({
  recipient = "",
  compact = false,
}: {
  recipient?: string;
  compact?: boolean;
}) {
  const [username, setUsername] = useState(recipient);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  async function load(before?: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/messages${before ? `?before=${before}` : ""}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((old) =>
        before ? [...old, ...data.messages] : data.messages,
      );
      setMore(data.messages.length === 50);
    } catch {
      setNotice("دریافت پیام‌های ارسال‌شده ممکن نشد؛ دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!compact) void load();
  }, [compact]);
  return (
    <section
      className={
        compact
          ? "mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4"
          : "mx-auto max-w-3xl px-4 py-8"
      }
    >
      <form
        className={
          compact ? "space-y-3" : "glass-card space-y-4 rounded-3xl p-6"
        }
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setNotice("");
          try {
            const res = await fetch("/api/admin/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: compact ? recipient : username,
                body,
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setBody("");
            setNotice(
              "پیام از طرف فروشنده ارسال شد و در پیام‌های مشتری نمایش داده می‌شود.",
            );
            if (!compact) await load();
          } catch (err) {
            setNotice(err instanceof Error ? err.message : "ارتباط برقرار نشد");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-black text-emerald-200">ارسال پیام به مشتری</h2>
        <p className="text-xs leading-6 text-slate-400">
          {compact
            ? `گیرنده: @${recipient}`
            : "نام کاربری مشتری را وارد کنید؛ پیام با عنوان «فروشنده نقشیران» در حساب او ثبت می‌شود."}
        </p>
        {!compact && (
          <label className="block text-sm">
            نام کاربری گیرنده
            <input
              required
              maxLength={64}
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field mt-2"
              placeholder="username"
            />
          </label>
        )}
        <label className="block text-sm">
          متن پیام
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input-field mt-2"
            placeholder="ممنون از خرید شما. سفارش شما به‌زودی ارسال خواهد شد."
          />
        </label>
        <p className="text-xs text-slate-400">
          {body.length.toLocaleString("fa-IR")} / ۲۰۰۰
        </p>
        <button
          disabled={busy || !body.trim()}
          className="btn-primary rounded-xl px-5 py-3 text-sm"
        >
          {busy ? "در حال ارسال..." : "ارسال پیام"}
        </button>
        {notice && (
          <p role="status" className="text-sm leading-7 text-amber-200">
            {notice}
          </p>
        )}
      </form>
      {!compact && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black">پیام‌های ارسال‌شده</h3>
            <button
              disabled={loading}
              onClick={() => void load()}
              className="btn-outline rounded-xl px-3 py-2 text-xs"
            >
              تازه‌سازی
            </button>
          </div>
          {messages.map((m) => (
            <article key={m.id} className="glass-card rounded-2xl p-4">
              <div className="flex justify-between gap-3 text-xs">
                <span dir="ltr" className="text-emerald-200">
                  @{m.username}
                </span>
                <span className="text-slate-400">
                  {new Date(m.createdAt).toLocaleString("fa-IR")}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                {m.body}
              </p>
              <p className="mt-3 text-xs text-amber-200">
                {m.readAt ? "خوانده شده" : "هنوز خوانده نشده"}
              </p>
            </article>
          ))}
          {loading && <p role="status">در حال دریافت...</p>}
          {!loading && !messages.length && (
            <p className="text-sm text-slate-400">هنوز پیامی ارسال نشده است.</p>
          )}
          {more && (
            <button
              disabled={loading}
              onClick={() => void load(messages.at(-1)?.id)}
              className="btn-outline rounded-xl px-5 py-3"
            >
              پیام‌های قدیمی‌تر
            </button>
          )}
        </div>
      )}
    </section>
  );
}
