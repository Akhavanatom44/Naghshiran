import type { ReactNode } from "react";
import Logo from "@/components/Logo";
import {
  HeadsetIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  ShieldIcon,
} from "@/components/icons";
import { STORE_ADDRESS, STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from "@/lib/format";

const features = [
  { icon: ShieldIcon, text: "حساب کاربری امن و رسمی با نشست رمزنگاری‌شده" },
  { icon: PackageIcon, text: "پیگیری لحظه‌ای وضعیت سفارش تا تأیید نهایی ادمین" },
  { icon: HeadsetIcon, text: "پشتیبانی سریع تلفنی و تلگرامی" },
];

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-14">
      <div className="glass-card fade-in-up overflow-hidden rounded-[1.75rem] shadow-[0_30px_80px_-30px_rgba(2,8,20,0.9)] md:grid md:grid-cols-5">
        {/* brand panel (desktop) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0e1c33] to-[#0a1322] p-8 md:flex md:col-span-2">
          <div className="blueprint-grid absolute inset-0 opacity-70" />
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <Logo size={54} />
              <div>
                <p className="text-2xl font-black text-white">نقشیران</p>
                <p className="text-xs text-[var(--muted)]">تجهیزات تخصصی نقشه‌برداری</p>
              </div>
            </div>

            <ul className="mt-10 space-y-5">
              {features.map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-400">
                    <f.icon className="h-4.5 w-4.5" />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-10 space-y-2.5 border-t border-[rgba(148,184,220,0.14)] pt-5 text-xs text-[var(--muted)]">
            <a href={STORE_PHONE_TEL} className="flex items-center gap-2 font-bold text-white transition hover:text-amber-300">
              <PhoneIcon className="h-4 w-4 text-teal-300" />
              <span dir="ltr">{STORE_PHONE_DISPLAY}</span>
            </a>
            <p className="flex items-start gap-2 leading-5">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              {STORE_ADDRESS}
            </p>
          </div>
        </aside>

        {/* form panel */}
        <section className="p-6 sm:p-10 md:col-span-3">
          {/* compact brand strip on mobile */}
          <div className="mb-7 flex items-center gap-3 md:hidden">
            <Logo size={46} />
            <div>
              <p className="text-lg font-black text-white">نقشیران</p>
              <p className="text-[11px] text-[var(--muted)]">تجهیزات تخصصی نقشه‌برداری</p>
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
