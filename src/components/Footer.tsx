import Link from "next/link";
import Logo from "@/components/Logo";
import {
  CrosshairIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";
import {
  STORE_ADDRESS,
  STORE_NAME,
  STORE_OWNER,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
} from "@/lib/format";

export default function Footer() {
  const year = new Date().toLocaleDateString("fa-IR", { year: "numeric" });

  return (
    <footer className="mt-16 border-t border-[rgba(148,184,220,0.14)] bg-[#081020]/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* brand */}
        <div>
          <div className="flex items-center gap-3">
            <Logo size={52} />
            <div>
              <p className="text-xl font-black text-white">{STORE_NAME}</p>
              <p className="text-xs text-[var(--muted)]">تجهیزات تخصصی نقشه‌برداری</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            فروشگاه تخصصی تجهیزات نقشه‌برداری و ژئوماتیک؛ خرید امن با فیش واریزی، تأیید سریع
            سفارش و ارسال به سراسر کشور یا تحویل حضوری در اصفهان.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[rgba(148,184,220,0.14)] bg-white/5 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/profile.png"
              alt="پروفایل فروشگاه نقشیران"
              className="h-11 w-11 rounded-xl object-cover"
            />
            <div className="text-xs leading-5 text-[var(--muted)]">
              <p className="font-bold text-white">مدیریت فروشگاه</p>
              <p>{STORE_OWNER}</p>
            </div>
          </div>
        </div>

        {/* contact */}
        <div>
          <h4 className="mb-4 text-sm font-black text-white">اطلاعات تماس</h4>
          <ul className="space-y-4 text-sm leading-6 text-[var(--muted)]">
            <li className="flex gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-400">
                <MapPinIcon className="h-4.5 w-4.5" />
              </span>
              <span>{STORE_ADDRESS}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-400/10 text-teal-300">
                <PhoneIcon className="h-4.5 w-4.5" />
              </span>
              <a
                href={STORE_PHONE_TEL}
                className="font-bold text-white transition hover:text-amber-300"
                dir="ltr"
              >
                {STORE_PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-400/10 text-teal-300">
                <UserIcon className="h-4.5 w-4.5" />
              </span>
              <span>
                مالک و مدیر فروشگاه: <span className="font-bold text-white">{STORE_OWNER}</span>
              </span>
            </li>
          </ul>
        </div>

        {/* quick links */}
        <div>
          <h4 className="mb-4 text-sm font-black text-white">دسترسی سریع</h4>
          <ul className="space-y-2.5 text-sm text-[var(--muted)]">
            <li>
              <Link href="/#shop" className="transition hover:text-amber-300">
                مشاهده محصولات
              </Link>
            </li>
            <li>
              <Link href="/cart" className="transition hover:text-amber-300">
                سبد خرید
              </Link>
            </li>
            <li>
              <Link href="/orders" className="transition hover:text-amber-300">
                پیگیری سفارش‌ها
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition hover:text-amber-300">
                ورود به حساب کاربری
              </Link>
            </li>
            <li>
              <Link href="/register" className="transition hover:text-amber-300">
                ثبت‌نام
              </Link>
            </li>

          </ul>
        </div>

        {/* purchase flow */}
        <div>
          <h4 className="mb-4 text-sm font-black text-white">روند خرید از نقشیران</h4>
          <ul className="space-y-3 text-sm text-[var(--muted)]">
            <li className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-black text-amber-300">۱</span>
              ثبت‌نام و ورود به حساب کاربری
            </li>
            <li className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-black text-amber-300">۲</span>
              افزودن محصولات به سبد خرید
            </li>
            <li className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-black text-amber-300">۳</span>
              ارسال فیش واریزی
            </li>
            <li className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-black text-amber-300">۴</span>
              تأیید سفارش توسط ادمین و هماهنگی ارسال
            </li>
          </ul>
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-teal-400/20 bg-teal-400/5 p-3 text-xs text-teal-200">
            <ShieldIcon className="h-5 w-5 shrink-0" />
            پرداخت شما پس از بررسی فیش، توسط ادمین فروشگاه تأیید می‌شود.
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(148,184,220,0.14)] py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-[var(--muted)] sm:px-6 md:flex-row">
          <p>
            © {year} فروشگاه {STORE_NAME} — مدیریت: {STORE_OWNER}. کلیه حقوق محفوظ است.
          </p>
          <p className="flex items-center gap-1.5">
            <CrosshairIcon className="h-4 w-4 text-amber-400" />
            دقیق، مانند یک نقشه‌بردار
          </p>
        </div>
      </div>
    </footer>
  );
}
