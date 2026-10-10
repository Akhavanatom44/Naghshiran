import { getDb } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { getAdminUser, adminErrorResponse } from "@/lib/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    orderId: z.number().int().positive(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    adminNote: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.adminNote !== undefined, {
    message: "تغییری برای ذخیره ارسال نشده است",
  });

async function requireAdmin() {
  try {
    const user = await getAdminUser();
    if (!user) {
      return {
        user: null,
        response: adminErrorResponse(
          "برای مشاهده پنل مدیریت باید با حساب ادمین وارد شوید",
          401,
        ),
      };
    }
    return { user, response: null };
  } catch (error) {
    console.error("[admin/orders] auth failed", error);
    return {
      user: null,
      response: adminErrorResponse("پنل مدیریت موقتاً در دسترس نیست", 503),
    };
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const db = await getDb();
    // Never include receipt blobs in the list: a single phone photo can be
    // larger than the rest of the dashboard response combined.
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
        username: users.username,
        accountPhone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    const ids = rows.map((row) => row.id);
    const itemRows = ids.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
      : [];

    const result = rows.map((order) => ({
      ...order,
      receiptAvailable: true,
      items: itemRows.filter((item) => item.orderId === order.id),
    }));

    return Response.json(
      { orders: result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/orders] list failed", error);
    return Response.json(
      { error: "دریافت سفارش‌های پنل مدیریت موقتاً ممکن نیست" },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const { orderId, status, adminNote } = parsed.data;
    const patch: {
      status?: "pending" | "approved" | "rejected";
      adminNote?: string | null;
      updatedAt?: Date;
    } = { updatedAt: new Date() };
    if (status !== undefined) patch.status = status;
    if (adminNote !== undefined) patch.adminNote = adminNote || null;

    await db.update(orders).set(patch).where(eq(orders.id, orderId));
    const updated = await db
      .select({
        id: orders.id,
        status: orders.status,
        adminNote: orders.adminNote,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!updated[0]) {
      return Response.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }
    return Response.json({ ok: true, order: updated[0] });
  } catch (error) {
    const message = String(error);
    if (message.includes("CHECKOUT_REJECTED_TERMINAL")) {
      return Response.json(
        { error: "سفارش ردشده قابل بازگشت نیست؛ سفارش جدید ایجاد کنید" },
        { status: 409 },
      );
    }
    console.error("[admin/orders] update failed", error);
    return Response.json(
      { error: "به‌روزرسانی سفارش انجام نشد" },
      { status: 503 },
    );
  }
}
