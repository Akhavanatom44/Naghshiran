"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
export default function MessageLink() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const res = await fetch("/api/messages?count=1", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active) setCount(data.unread);
        }
      } catch {
        /* Keep the inbox reachable during a transient failure. */
      }
    }
    void refresh();
    const id = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30_000);
    window.addEventListener("messages-read", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("messages-read", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [user?.id]);
  return (
    <Link
      href="/messages"
      className="relative rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-bold text-slate-200"
      aria-label={count ? `پیام‌ها، ${count} پیام جدید` : "پیام‌ها"}
    >
      پیام‌ها
      {count > 0 && (
        <span className="mr-1 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] text-emerald-950">
          {count.toLocaleString("fa-IR")}
        </span>
      )}
    </Link>
  );
}
