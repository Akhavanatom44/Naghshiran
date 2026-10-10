import { getDb } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getAdminUser, adminErrorResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  try {
    const user = await getAdminUser();
    return user
      ? { response: null }
      : {
          response: adminErrorResponse(
            "برای مشاهده فیش باید با حساب ادمین وارد شوید",
            401,
          ),
        };
  } catch (error) {
    console.error("[admin/order] auth failed", error);
    return {
      response: adminErrorResponse("پنل مدیریت موقتاً در دسترس نیست", 503),
    };
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return Response.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400 });
  }

  try {
    const db = await getDb();
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
        receiptImage: orders.receiptImage,
        adminNote: orders.adminNote,
        telegramStatus: orders.telegramStatus,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        username: users.username,
        accountPhone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(and(eq(orders.id, orderId), eq(orders.userId, users.id)))
      .limit(1);

    const order = rows[0];
    if (!order) {
      return Response.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return Response.json(
      { order: { ...order, items } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/order] detail failed", error);
    return Response.json(
      { error: "دریافت جزئیات سفارش موقتاً ممکن نیست" },
      { status: 503 },
    );
  }
}
