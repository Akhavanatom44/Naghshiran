"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { LockIcon, PhoneIcon, ShieldIcon, UserIcon } from "@/components/icons";
import { clearPendingProduct, pendingProductCode } from "@/lib/cart-storage";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

type AuthMode = "login" | "register";

type LoginFormProps = {
  initialMode: AuthMode;
  nextPath: string;
  initialProductCode?: number | null;
};

export default function LoginForm({
  initialMode,
  nextPath,
  initialProductCode = null,
}: LoginFormProps) {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const { addItem, showToast, ready: cartReady } = useCart();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const completing = useRef(false);
  const submitting = useRef(false);

  async function finishLogin() {
    if (completing.current) return;
    completing.current = true;
    const code = initialProductCode ?? pendingProductCode();
    if (code !== null) {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) throw new Error("products unavailable");
        const data = await response.json();
        if (data.databaseConfigured === false)
          throw new Error("database unavailable");
        const product = data.products?.find(
          (p: { code: number }) => p.code === code,
        );
        clearPendingProduct();
        if (product && product.canPurchase !== false && product.stock > 0) {
          addItem({
            productId: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            stock: product.stock,
          });
          showToast("محصول انتخاب‌شده به سبد خرید اضافه شد");
        } else {
          showToast(
            "محصول انتخاب‌شده دیگر موجود نیست؛ محصول دیگری انتخاب کنید",
          );
        }
      } catch {
        completing.current = false;
        setError(
          "وارد شدید، اما دریافت محصول انجام نشد؛ دکمهٔ ادامه را بزنید تا دوباره تلاش کنیم.",
        );
        return;
      }
    }
    router.replace(nextPath);
    router.refresh();
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (user && cartReady && !authLoading) void finishLogin();
    }, 0);
    return () => window.clearTimeout(timer);
    // One completion per mount. The ref prevents double addition in Strict Mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cartReady, authLoading]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setErrorCode("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (user) {
      await finishLogin();
      return;
    }
    if (!cartReady) {
      setError("در حال آماده‌سازی سبد خرید هستیم؛ لطفاً لحظه‌ای صبر کنید.");
      return;
    }
    setError("");
    setErrorCode("");
    submitting.current = true;
    setLoading(true);

    try {
      const registering = mode === "register";
      const response = await fetch(
        registering ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            registering
              ? { username, password, phone, fullName }
              : { username, password },
          ),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          data.error ??
            (registering ? "ثبت‌نام ناموفق بود" : "ورود ناموفق بود"),
        );
        setErrorCode(data.code ?? "");
        return;
      }

      const currentUser = await refresh();
      if (!currentUser) {
        setError(
          "ورود انجام شد اما نشست مرورگر تأیید نشد؛ اجازهٔ کوکی را بررسی و دوباره تلاش کنید.",
        );
        return;
      }
      await finishLogin();
    } catch {
      setError("خطا در برقراری ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-5 inline-flex rounded-xl border border-[rgba(148,184,220,0.16)] bg-white/5 p-1">
        <button
          type="button"
          onClick={() => changeMode("register")}
          aria-pressed={mode === "register"}
          className={`rounded-lg px-4 py-2.5 text-xs font-extrabold transition ${
            mode === "register"
              ? "bg-amber-400/15 text-amber-200"
              : "text-[var(--muted)] hover:text-white"
          }`}
        >
          ثبت‌نام
        </button>
        <button
          type="button"
          onClick={() => changeMode("login")}
          aria-pressed={mode === "login"}
          className={`rounded-lg px-4 py-2.5 text-xs font-extrabold transition ${
            mode === "login"
              ? "bg-amber-400/15 text-amber-200"
              : "text-[var(--muted)] hover:text-white"
          }`}
        >
          ورود
        </button>
      </div>

      <h1 className="text-2xl font-black text-white">
        {mode === "register" ? "ساخت حساب نقشیران" : "ورود به حساب کاربری"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {mode === "register"
          ? "برای افزودن محصول و پیگیری سفارش، شماره موبایل و اطلاعات حساب را وارد کنید."
          : "با نام کاربری و رمز عبورتان وارد شوید تا سبد خرید و سفارش‌هایتان در دسترس باشد."}
      </p>

      {user && (
        <button
          type="button"
          onClick={() => void finishLogin()}
          className="btn-primary mt-5 w-full rounded-xl py-3"
        >
          ادامهٔ خرید
        </button>
      )}
      <form
        hidden={Boolean(user)}
        onSubmit={onSubmit}
        className="mt-6 space-y-4"
      >
        {mode === "register" && (
          <>
            <div>
              <label
                htmlFor="register-phone"
                className="mb-1.5 block text-xs font-bold text-[var(--muted)]"
              >
                شماره موبایل <span className="text-rose-300">*</span>
              </label>
              <div className="relative">
                <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="register-phone"
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="input-field with-icon text-left"
                  placeholder="09131147897"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-[var(--muted)]">
                شماره برای هماهنگی و پیگیری سفارش در اختیار فروشگاه نقشیران قرار
                می‌گیرد.
              </p>
            </div>
            <div>
              <label
                htmlFor="register-name"
                className="mb-1.5 block text-xs font-bold text-[var(--muted)]"
              >
                نام و نام خانوادگی{" "}
                <span className="font-normal">(اختیاری)</span>
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="register-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="input-field with-icon"
                  placeholder="برای خطاب بهتر فروشگاه"
                  autoComplete="name"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="auth-username"
            className="mb-1.5 block text-xs font-bold text-[var(--muted)]"
          >
            نام کاربری انگلیسی
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              id="auth-username"
              required
              minLength={mode === "register" ? 3 : 1}
              maxLength={32}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="input-field with-icon text-left"
              placeholder="username"
              dir="ltr"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          {mode === "register" && (
            <p className="mt-1.5 text-[11px] text-[var(--muted)]">
              فقط حروف انگلیسی، عدد و زیرخط؛ حداقل ۳ کاراکتر.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-xs font-bold text-[var(--muted)]"
          >
            رمز عبور
          </label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              id="auth-password"
              required
              type="password"
              minLength={mode === "register" ? 8 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field with-icon text-left"
              placeholder={mode === "register" ? "حداقل ۸ کاراکتر" : "رمز عبور"}
              dir="ltr"
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
            />
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-sm leading-6 text-rose-300"
            role="alert"
          >
            {error}
            {errorCode === "PHONE_EXISTS" && (
              <button
                type="button"
                onClick={() => changeMode("login")}
                className="mr-2 font-black text-amber-200 underline underline-offset-4"
              >
                ورود به حساب
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !cartReady}
          className="btn-primary w-full rounded-xl py-3.5 text-sm"
        >
          {loading
            ? mode === "register"
              ? "در حال ساخت حساب..."
              : "در حال ورود..."
            : mode === "register"
              ? "ثبت‌نام و ادامه خرید"
              : "ورود به حساب"}
        </button>
      </form>

      <p className="mt-5 flex items-start justify-center gap-1.5 text-center text-[11px] leading-5 text-[var(--muted)]">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
        رمز عبور به‌صورت رمزنگاری‌شده ذخیره می‌شود؛ شماره موبایل برای تماس
        فروشگاه با شما ثبت می‌گردد.
      </p>

      <div className="mt-6 border-t border-[rgba(148,184,220,0.14)] pt-5 text-center text-sm text-[var(--muted)]">
        {mode === "register"
          ? "قبلاً حساب ساخته‌اید؟"
          : "برای نخستین خرید به حساب نیاز دارید؟"}{" "}
        <button
          type="button"
          onClick={() => changeMode(mode === "register" ? "login" : "register")}
          className="font-black text-amber-300 transition hover:text-amber-200"
        >
          {mode === "register" ? "وارد شوید" : "ثبت‌نام کنید"}
        </button>
      </div>
    </AuthShell>
  );
}
