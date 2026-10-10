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
    const rows = await db
      .select()
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
