# فروشگاه اینترنتی نقشیران

فروشگاه تخصصی تجهیزات نقشه‌برداری نقشیران، ساخته‌شده با Next.js، Drizzle ORM و Cloudflare D1، و اجرا روی Cloudflare Workers با آداپتور OpenNext.

- **مدیریت فروشگاه:** منصور اخوان حریری
- **نشانی:** اصفهان، خیابان استانداری، نبش خیابان فرشادی، فروشگاه نقشیران
- **تلفن فروشگاه:** ۰۹۱۳۱۱۴۷۸۹۷

## امکانات

- صفحه‌ی نخست مستقیماً ویترین محصولات است؛ جست‌وجو، دسته‌بندی و مرتب‌سازی قیمت دارد.
- ۵۰ محصول ارسال‌شده در `src/data/catalog.json` ثبت شده‌اند. برای هر محصول یک تصویر گرافیکی اختصاصی با پس‌زمینه و نورپردازی هماهنگ با ویترین سفید نقشیران در `public/images/catalog/` ساخته شده است.
- طبق درخواست فروشگاه، قیمت مبنا برای هر ۵۰ آگهیِ دارای زمان، ۵۰٪ افزایش داده شده است. قیمت نهایی در سایت و سفارش‌ها به تومان است.
- افزودن محصول با دکمه‌ی «+» برای مهمان، ابتدا صفحه‌ی ورود/ثبت‌نام را باز می‌کند؛ بعد از تکمیل حساب، همان محصول به سبد اضافه و کاربر به سبد خرید برگردانده می‌شود.
- ثبت‌نام شماره‌ی موبایل ایرانی، نام کاربری انگلیسی و رمز شخصی می‌گیرد. رمز با bcrypt هش می‌شود؛ شماره در جدول کاربران ذخیره می‌شود و هنگام ثبت سفارش، شماره‌ی حساب نیز با شماره‌ی نهایی سفارش همگام می‌شود تا فروشگاه بتواند برای هماهنگی تماس بگیرد.
- سبد خرید در مرورگر نگهداری می‌شود؛ قیمت نهایی و موجودی هنگام ثبت سفارش دوباره از پایگاه داده بررسی می‌شوند.
- پیگیری سفارش، ثبت تصویر فیش واریزی، ارسال اعلان به تلگرام (در صورت تنظیم توکن و شناسه‌ی ادمین) و مشاهده‌ی حساب کاربری در دسترس هستند. چون شماره‌کارت معتبر ارائه نشده، صفحه‌ی تسویه به‌جای نمایش شماره‌ی آزمایشی، کاربر را برای دریافت اطلاعات پرداخت به تماس با فروشگاه راهنمایی می‌کند.

## پایگاه داده (Cloudflare D1)

- نام دیتابیس: `d1_naghshiran`
- شناسه: `96fcda7f-4093-47d2-b210-75b749658c65`
- binding در `wrangler.jsonc`: `DB`

ساختار جداول در `src/db/schema.ts` (SQLite) تعریف شده و فایل‌های SQL آن در پوشه‌ی `drizzle/` قرار دارند. ستون‌های قیمت از نوع INTEGER 64 بیتی هستند و قیمت‌های میلیاردی تومان را بدون سرریز نگه می‌دارند.

### یک‌بار پیش از اولین دیپلوی

```bash
npm ci
npx wrangler login        # ورود به حساب Cloudflare
npm run db:push           # ساخت جداول روی D1 واقعی
npm run db:seed           # واردکردن ۵۰ محصول (با ۵۰٪ افزایش قیمت)
```

اجرای دوباره‌ی `db:seed` محصولات موجود را بازنویسی نمی‌کند.

## راه‌اندازی محلی

```bash
npm ci
cp .env.example .dev.vars   # SESSION_SECRET را تنظیم کنید
npm run db:push:local
npm run db:seed:local
npm run preview             # اجرای واقعی Worker با D1 محلی روی http://localhost:8787
# یا برای توسعه‌ی سریع:
npm run dev
```

## متغیرهای محیطی

نمونه در `.env.example` است. دیگر به `DATABASE_URL` نیازی نیست؛ اتصال از طریق binding `DB` برقرار می‌شود.

```env
SESSION_SECRET=یک-رشته-تصادفی-طولانی-حداقل-۳۲-کاراکتر
NEXT_PUBLIC_SITE_URL=https://your-domain.example
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_IDS=
```

در Cloudflare این مقادیر را در بخش **Settings → Variables and Secrets** پروژه تعریف کنید (یا با `npx wrangler secret put SESSION_SECRET`).

## دیپلوی روی Cloudflare

این پروژه با **Next.js + OpenNext + Cloudflare Workers + D1** تنظیم شده است. در Cloudflare Workers Builds، برای جلوگیری از ورود OpenNext به حلقه‌ی بازگشتی، دستور build اصلی پروژه همان `npm run build` است و این دستور در `package.json` مستقیماً `opennextjs-cloudflare build` را اجرا می‌کند؛ OpenNext نیز از `buildCommand` موجود در `open-next.config.ts` برای اجرای `npm run build:next` استفاده می‌کند.

تنظیمات پیشنهادی Workers Builds:

| تنظیم | مقدار |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Root directory | `/` |

فایل `wrangler.jsonc` نیز Worker، assetها و binding دیتابیس D1 با نام `d1_naghshiran` و شناسه جدید را تعریف می‌کند.

در بخش **Build Variables and secrets** کلودفلر، مقدار `SESSION_SECRET` را با یک رشته تصادفی حداقل ۳۲ کاراکتری تنظیم کنید و در صورت استفاده از اعلان تلگرام، `TELEGRAM_BOT_TOKEN` و `TELEGRAM_ADMIN_CHAT_IDS` را نیز وارد کنید.

`npm run deploy` برای محیطی مناسب است که build و deploy را در یک دستور انجام می‌دهد؛ در Workers Builds می‌توانید build و deploy را در دو مرحله‌ی بالا قرار دهید.

## تصاویر محصولات

عکس‌های تولیدشده در `public/images/catalog/<code>.jpg` قرار می‌گیرند؛ برای محصولاتی که هنوز عکس ندارند، تصویر SVG همان کد نمایش داده می‌شود. پس از افزودن عکس جدید:

```bash
node scripts/catalog-image-manifest.mjs
```

## دستورهای مفید

```bash
npm run dev          # توسعه
npm run typecheck    # بررسی TypeScript
npm run lint         # بررسی ESLint
npm run build        # ساخت production
npm run preview      # اجرای Worker با D1 محلی
npm run deploy       # ساخت و دیپلوی روی Cloudflare Workers
npm run db:generate  # ساخت فایل SQL از schema
npm run db:push      # اعمال schema روی D1 (--local برای محلی)
npm run db:seed      # واردکردن کاتالوگ پایه (--local برای محلی)
```
