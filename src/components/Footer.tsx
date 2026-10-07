export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-white">
            فروشگاه <span className="gradient-text">نقش ایران</span>
          </h3>
          <p className="text-sm leading-7 text-violet-100/70">
            خرید آنلاین با تجربه‌ای رنگارنگ، سریع و امن. سفارش خود را ثبت کنید، فیش واریزی
            را ارسال کنید و منتظر تأیید و ارسال کالا باشید.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white">آدرس فروشگاه</h4>
          <p className="text-sm leading-7 text-violet-100/70">
            📍 خیابان استانداری، نبش خیابان فرشادی، فروشگاه نقش ایران
          </p>
          <p className="mt-2 text-sm leading-7 text-violet-100/70">
            امکان تحویل حضوری از فروشگاه یا ارسال با پیک (هزینه پیک بر عهده مشتری) فراهم است.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white">روند خرید</h4>
          <ol className="list-inside list-decimal space-y-1 text-sm leading-7 text-violet-100/70">
            <li>ثبت‌نام با نام کاربری و رمز عبور</li>
            <li>افزودن محصولات به سبد خرید</li>
            <li>تکمیل اطلاعات گیرنده و روش تحویل</li>
            <li>ارسال فیش واریزی</li>
            <li>تأیید سفارش توسط ادمین از طریق ربات تلگرام</li>
          </ol>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-violet-100/50">
        © {new Date().getFullYear()} فروشگاه نقش ایران — تمامی حقوق محفوظ است.
      </div>
    </footer>
  );
}
