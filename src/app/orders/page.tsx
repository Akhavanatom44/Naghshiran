import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import { PackageIcon } from "@/components/icons";
import { faNum, formatToman } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  type OrderRow = typeof orders.$inferSelect;
  type ItemRow = typeof orderItems.$inferSelect;

  let myOrders: OrderRow[] = [];
  let dbError = false;
  try {
    myOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  } catch {
    dbError = true;
  }

  const ids = myOrders.map((o) => o.id);
  let items: ItemRow[] = [];
  if (!dbError && ids.length) {
    try {
      items = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));
    } catch {
      items = [];
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-xl font-black text-white sm:text-2xl">
        سفارش‌های <span className="gradient-text">من</span>
      </h1>

      {dbError ? (
        <div className="glass-card rounded-3xl p-14 text-center text-[var(--muted)]">
          در حال حاضر امکان نمایش سفارش‌ها وجود ندارد؛ لطفاً دوباره تلاش کنید.
        </div>
      ) : myOrders.length === 0 ? (
        <div className="glass-card fade-in-up rounded-3xl p-14 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-amber-400/10 text-amber-400">
            <PackageIcon className="h-9 w-9" />
          </span>
          <p className="mt-5 font-bold text-white">هنوز سفارشی ثبت نکرده‌اید</p>
          <Link href="/#shop" className="btn-primary mt-6 inline-flex rounded-xl px-6 py-3 text-sm">
            شروع خرید
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {myOrders.map((o, i) => {
            const orderProducts = items.filter((it) => it.orderId === o.id);
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="glass-card fade-in-up block rounded-2xl p-4 transition hover:border-amber-400/40 sm:p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-white sm:text-base">
                      سفارش شماره #{faNum(o.id)}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      {new Date(o.createdAt).toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(148,184,220,0.14)] pt-3 text-sm">
                  <span className="text-[var(--muted)]">{faNum(orderProducts.length)} قلم کالا</span>
                  <span className="font-black text-amber-300">{formatToman(o.totalAmount)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
