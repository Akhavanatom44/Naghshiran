import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatToman(amount: number) {
  return amount.toLocaleString("fa-IR") + " تومان";
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { submitted } = await searchParams;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);
  const order = rows[0];
  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {submitted === "1" && (
        <div className="mb-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-200">
          ✅ سفارش شما با موفقیت ثبت شد و فیش واریزی برای بررسی به ادمین‌ها ارسال گردید.
        </div>
      )}

      <div className="glass-card neon-border rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              سفارش شماره #{order.id.toLocaleString("fa-IR")}
            </h1>
            <p className="mt-1 text-xs text-violet-100/50">
              {new Date(order.createdAt).toLocaleString("fa-IR")}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.status === "rejected" && order.adminNote && (
          <div className="mt-5 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            <p className="font-bold">دلیل رد سفارش:</p>
            <p className="mt-1">{order.adminNote}</p>
          </div>
        )}

        {order.status === "pending" && (
          <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            فیش واریزی شما در حال بررسی توسط ادمین فروشگاه است. نتیجه به‌زودی اینجا نمایش داده
            می‌شود.
          </div>
        )}

        {order.status === "approved" && (
          <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            سفارش شما تأیید شد. طی روزهای آینده کالا برای شما ارسال/آماده تحویل خواهد شد.
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4 text-sm">
            <p className="text-violet-100/50">گیرنده</p>
            <p className="mt-1 font-bold text-white">{order.fullName}</p>
            <p className="mt-1 text-violet-100/70" dir="ltr">
              {order.phone}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-sm">
            <p className="text-violet-100/50">روش تحویل</p>
            <p className="mt-1 font-bold text-white">
              {order.deliveryMethod === "pickup" ? "تحویل حضوری از فروشگاه" : "ارسال با پیک"}
            </p>
            {order.deliveryMethod === "ship" && (
              <p className="mt-1 text-violet-100/70">{order.address}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-bold text-white">اقلام سفارش</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 text-sm"
              >
                <span className="text-violet-100/80">
                  {item.productName} (کد {item.productCode.toLocaleString("fa-IR")}) ×{" "}
                  {item.quantity.toLocaleString("fa-IR")}
                </span>
                <span className="font-semibold text-white">
                  {formatToman(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
            <span>مبلغ کل</span>
            <span className="gradient-text">{formatToman(order.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-bold text-white">فیش واریزی ارسالی</p>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.receiptImage} alt="فیش واریزی" className="max-h-80 w-full object-contain" />
          </div>
        </div>

        <Link
          href="/orders"
          className="mt-8 inline-block rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          ← بازگشت به سفارش‌ها
        </Link>
      </div>
    </main>
  );
}
