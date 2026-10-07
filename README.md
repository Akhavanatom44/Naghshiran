# فروشگاه اینترنتی نقش ایران

یک فروشگاه اینترنتی کامل با Next.js (App Router) + Drizzle ORM + PostgreSQL، به همراه
یک ربات تلگرامی مستقل (Python / aiogram) برای مدیریت کامل فروشگاه.

## بخش‌های پروژه

- **وب‌سایت فروشگاه** (این پوشه، ریشه‌ی پروژه): Next.js + Tailwind + PostgreSQL
- **ربات تلگرامی** (پوشه‌ی `telegram-bot/`): پروژه‌ی کاملاً مستقل پایتونی با Dockerfile
  جدا، که باید به‌صورت جداگانه (مثلاً روی Dokploy) دیپلوی شود.

هر دو پروژه به **یک دیتابیس PostgreSQL مشترک** وصل می‌شوند تا محصولات، کاربران و
سفارش‌ها همیشه هماهنگ باشند.

## امکانات وب‌سایت

- طراحی رنگارنگ با افکت‌های نورپردازی، گرادیان‌های نئونی، شیشه‌ای (Glassmorphism) و انیمیشن
- ثبت‌نام و ورود کاربران با نام کاربری و رمز عبور (رمزنگاری با bcrypt + سشن امن با JWT)
- سبد خرید (ذخیره در مرورگر کاربر) با امکان افزایش/کاهش تعداد و حذف کالا
- تسویه حساب با دریافت نام، شماره تماس، روش تحویل (ارسال با پیک یا تحویل حضوری) و آدرس
- آپلود تصویر فیش واریزی و ارسال خودکار آن (همراه جزئیات سفارش) به تمام ادمین‌های
  ربات تلگرامی با دکمه‌های «تأیید» / «رد»
- پیگیری سفارش‌ها و مشاهده‌ی لحظه‌ای وضعیت (در انتظار / تأیید شده / رد شده با دلیل)
- آدرس فروشگاه برای تحویل حضوری: خیابان استانداری، نبش خیابان فرشادی، فروشگاه نقش ایران

## متغیرهای محیطی (`.env`)

```
DATABASE_URL=...                 # از قبل تنظیم شده
SESSION_SECRET=...               # یک رشته‌ی تصادفی و طولانی برای امضای سشن کاربران
TELEGRAM_BOT_TOKEN=...           # توکن ربات (باید دقیقاً همان توکن ربات تلگرامی باشد)
TELEGRAM_ADMIN_CHAT_IDS=111,222  # شناسه چت ادمین‌ها، جدا شده با کاما
```

اگر `TELEGRAM_BOT_TOKEN` یا `TELEGRAM_ADMIN_CHAT_IDS` خالی باشند، سفارش‌ها همچنان در
دیتابیس ثبت می‌شوند ولی پیام تلگرامی ارسال نخواهد شد (در لاگ هشدار داده می‌شود).

## دستورهای توسعه

```bash
npm install
npx drizzle-kit push     # اعمال schema روی دیتابیس
npm run dev
```

## دیپلوی وب‌سایت

این پروژه یک اپلیکیشن استاندارد Next.js با Node.js runtime است (استفاده از `pg`،
`bcryptjs` و `jose`) و روی هر هاست Node.js (مانند Vercel، Railway، VPS با Docker و…)
به‌سادگی قابل اجراست.

برای دیپلوی روی **Cloudflare**:
- ساده‌ترین روش: دیپلوی خروجی build این پروژه را روی یک سرور Node (یا Railway/Render)
  اجرا کنید و فقط DNS/CDN دامنه را از طریق Cloudflare مدیریت کنید.
- در صورت نیاز به اجرای مستقیم روی **Cloudflare Workers/Pages**، باید از آداپتور
  رسمی [`@cloudflare/next-on-pages`](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
  استفاده کنید و برای اتصال به PostgreSQL از سرویس
  [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) بهره ببرید،
  چون Workers به‌صورت پیش‌فرض اجازه‌ی اتصال TCP مستقیم به دیتابیس را نمی‌دهد.

## دیپلوی ربات تلگرامی

به‌طور کامل در `telegram-bot/README.md` توضیح داده شده است (شامل راهنمای Dockerfile
و دیپلوی روی Dokploy).

## آپلود در گیت‌هاب

پیشنهاد می‌شود دو ریپازیتوری جدا بسازید (یکی برای وب‌سایت و یکی برای ربات) چون
پلتفرم‌های دیپلوی (Cloudflare برای سایت، Dokploy برای ربات) معمولاً هرکدام یک
ریپازیتوری مجزا را دنبال می‌کنند:

```bash
# وب‌سایت
git init && git add . && git commit -m "Initial commit"
git remote add origin <repo-site-url>
git push -u origin main

# ربات (در پوشه telegram-bot)
cd telegram-bot
git init && git add . && git commit -m "Initial commit"
git remote add origin <repo-bot-url>
git push -u origin main
```
