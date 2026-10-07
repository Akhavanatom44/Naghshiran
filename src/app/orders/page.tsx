import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatToman(amount: number) {
  return amount.toLocaleString("fa-IR") + " تومان";
}

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  const ids = myOrders.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-extrabold text-white">
        📦 سفارش‌های <span className="gradient-text">من</span>
      </h1>

      {myOrders.length === 0 ? (
        <div className="glass-card rounded-3xl p-14 text-center">
          <p className="text-5xl">📭</p>
          <p className="mt-4 text-violet-100/70">هنوز سفارشی ثبت نکرده‌اید.</p>
          <Link href="/" className="btn-glow mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold text-white">
            شروع خرید
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => {
            const orderProducts = items.filter((i) => i.orderId === order.id);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="glass-card block rounded-2xl p-5 transition hover:border-fuchsia-400/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">سفارش شماره #{order.id.toLocaleString("fa-IR")}</p>
                    <p className="mt-1 text-xs text-violet-100/50">
                      {new Date(order.createdAt).toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-violet-100/70">
                  <span>{orderProducts.length.toLocaleString("fa-IR")} قلم کالا</span>
                  <span className="font-bold text-white">{formatToman(order.totalAmount)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
