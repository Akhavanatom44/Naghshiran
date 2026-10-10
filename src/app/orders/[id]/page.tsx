import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getDb } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import OrderStatusLive from "@/components/OrderStatusLive";
import { CheckIcon, MapPinIcon, PhoneIcon, ReceiptIcon, TruckIcon, UserIcon } from "@/components/icons";
import { faNum, formatToman, STORE_ADDRESS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/orders/${id}`)}`);

  const { submitted } = await searchParams;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  type OrderRow = typeof orders.$inferSelect;
  type ItemRow = typeof orderItems.$inferSelect;

  let order: OrderRow | null = null;
  let items: ItemRow[] = [];
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);
    order = rows[0] ?? null;
    if (order) {
      items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    }
  } catch {
    order = null;
  }
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {submitted === "1" && (
        <div className="fade-in-up mb-6 flex items-start gap-3 rounded-2xl border border-teal-400/40 bg-teal-400/10 p-4 text-sm leading-7 text-teal-200">
          <CheckIcon className="mt-1 h-5 w-5 shrink-0" />
          سفارش شما با موفقیت ثبت شد و فیش واریزی برای بررسی به ادمین‌های فروشگاه ارسال گردید.
        </div>
      )}

      <div className="glass-card fade-in-up rounded-3xl p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(148,184,220,0.14)] pb-5">
          <div>
            <h1 className="text-lg font-black text-white sm:text-xl">
              سفارش شماره #{faNum(order.id)}
            </h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {new Date(order.createdAt).toLocaleString("fa-IR")}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* live approval notification (polls until the admin decides) */}
        <OrderStatusLive
          orderId={order.id}
          initialStatus={order.status}
          initialNote={order.adminNote}
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4 text-sm">
            <p className="flex items-center gap-1.5 text-[var(--muted)]">
              <UserIcon className="h-4 w-4 text-teal-300" />
              گیرنده
            </p>
            <p className="mt-2 font-black text-white">{order.fullName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[var(--muted)]" dir="ltr">
              <PhoneIcon className="h-3.5 w-3.5" />
              {order.phone}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-sm">
            <p className="flex items-center gap-1.5 text-[var(--muted)]">
              {order.deliveryMethod === "pickup" ? (
                <MapPinIcon className="h-4 w-4 text-teal-300" />
              ) : (
                <TruckIcon className="h-4 w-4 text-teal-300" />
              )}
              روش تحویل
            </p>
            <p className="mt-2 font-black text-white">
              {order.deliveryMethod === "pickup" ? "تحویل حضوری از فروشگاه" : "ارسال با پیک"}
            </p>
            <p className="mt-1 leading-6 text-[var(--muted)]">
              {order.deliveryMethod === "ship" ? order.address : STORE_ADDRESS}
            </p>
          </div>
        </div>

        {order.customerNote && (
          <div className="mt-6 rounded-2xl border border-teal-400/20 bg-teal-400/5 p-4 text-sm leading-7">
            <p className="font-black text-teal-200">توضیحات شما برای فروشگاه</p>
            <p className="mt-1 text-[var(--muted)]">{order.customerNote}</p>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2.5 text-sm font-black text-white">اقلام سفارش</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm"
              >
                <span className="text-[var(--muted)]">
                  {item.productName} (کد {faNum(item.productCode)}) × {faNum(item.quantity)}
                </span>
                <span className="shrink-0 font-bold text-white">
                  {formatToman(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[rgba(148,184,220,0.14)] pt-3">
            <span className="text-sm font-black text-white">مبلغ کل</span>
            <span className="text-base font-black text-amber-300">{formatToman(order.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2.5 flex items-center gap-1.5 text-sm font-black text-white">
            <ReceiptIcon className="h-4 w-4 text-teal-300" />
            فیش واریزی ارسالی
          </p>
          <div className="overflow-hidden rounded-xl border border-[rgba(148,184,220,0.2)] bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.receiptImage} alt="فیش واریزی" className="max-h-80 w-full object-contain" />
          </div>
        </div>

        <Link href="/orders" className="btn-outline mt-8 inline-flex rounded-xl px-5 py-2.5 text-sm">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    </main>
  );
}
