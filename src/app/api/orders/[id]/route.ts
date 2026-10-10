import { getDb } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return Response.json(
        { error: "ابتدا وارد حساب کاربری خود شوید" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return Response.json(
        { error: "شناسه سفارش نامعتبر است" },
        { status: 400 },
      );
    }

    const db = await getDb();
    // Polled every few seconds by the order page: never send the receipt blob.
    const rows = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        fullName: orders.fullName,
        phone: orders.phone,
        deliveryMethod: orders.deliveryMethod,
        address: orders.address,
        customerNote: orders.customerNote,
        adminNote: orders.adminNote,
        telegramStatus: orders.telegramStatus,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);

    const order = rows[0];
    if (!order) {
      return Response.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return Response.json({ order: { ...order, items } });
  } catch {
    return Response.json(
      { error: "دریافت سفارش موقتاً ممکن نیست" },
      { status: 503 },
    );
  }
}
