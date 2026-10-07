import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { notifyAdminsAboutOrder } from "@/lib/telegram";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().max(99),
      })
    )
    .min(1, "سبد خرید شما خالی است"),
  fullName: z.string().trim().min(2, "نام و نام خانوادگی را وارد کنید").max(128),
  phone: z.string().trim().min(8, "شماره تلفن معتبر وارد کنید").max(32),
  deliveryMethod: z.enum(["ship", "pickup"]),
  address: z.string().trim().max(500).optional().nullable(),
  receiptImage: z
    .string()
    .startsWith("data:image/", "تصویر فیش واریزی نامعتبر است")
    .max(8_000_000, "حجم تصویر فیش واریزی زیاد است"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "برای مشاهده سفارش‌ها ابتدا وارد شوید" }, { status: 401 });
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  if (userOrders.length === 0) {
    return Response.json({ orders: [] });
  }

  const ids = userOrders.map((o) => o.id);
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));

  const result = userOrders.map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }));

  return Response.json({ orders: result });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "اطلاعات ارسالی نامعتبر است" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.deliveryMethod === "ship" && (!data.address || data.address.trim().length < 5)) {
    return Response.json({ error: "برای ارسال با پیک، آدرس دقیق را وارد کنید" }, { status: 400 });
  }

  const productIds = data.items.map((i) => i.productId);
  const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));

  if (dbProducts.length !== new Set(productIds).size) {
    return Response.json({ error: "برخی از محصولات انتخابی دیگر موجود نیستند" }, { status: 400 });
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  let totalAmount = 0;
  const itemsForInsert = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    totalAmount += product.price * item.quantity;
    return {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      unitPrice: product.price,
      quantity: item.quantity,
    };
  });

  const orderId = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(orders)
      .values({
        userId: user.id,
        status: "pending",
        totalAmount,
        fullName: data.fullName,
        phone: data.phone,
        deliveryMethod: data.deliveryMethod,
        address: data.deliveryMethod === "ship" ? data.address ?? null : null,
        receiptImage: data.receiptImage,
      })
      .returning({ id: orders.id });

    const newOrderId = inserted[0].id;

    await tx.insert(orderItems).values(
      itemsForInsert.map((item) => ({
        ...item,
        orderId: newOrderId,
      }))
    );

    return newOrderId;
  });

  try {
    const notifyResult = await notifyAdminsAboutOrder({
      id: orderId,
      totalAmount,
      fullName: data.fullName,
      phone: data.phone,
      deliveryMethod: data.deliveryMethod,
      address: data.address ?? null,
      receiptImage: data.receiptImage,
      items: itemsForInsert,
    });
    await db
      .update(orders)
      .set({ telegramStatus: notifyResult.ok ? "sent" : "failed" })
      .where(eq(orders.id, orderId));
  } catch (err) {
    console.error("[orders] failed to notify telegram admins", err);
    await db.update(orders).set({ telegramStatus: "failed" }).where(eq(orders.id, orderId));
  }

  return Response.json({ ok: true, orderId, totalAmount });
}
