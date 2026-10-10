import { getDb, getRawDb } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { notifyAdminsAboutOrder } from "@/lib/telegram";
import { checkoutSchema, checkoutHash } from "@/lib/checkout";
import { sellingPrice } from "@/lib/product-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return Response.json(
        { error: "برای مشاهده سفارش‌ها ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const db = await getDb();
    const userOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        fullName: orders.fullName,
        phone: orders.phone,
        deliveryMethod: orders.deliveryMethod,
        address: orders.address,
        adminNote: orders.adminNote,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      return Response.json({ orders: [] });
    }

    const ids = userOrders.map((o) => o.id);
    const items = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, ids));

    const result = userOrders.map((order) => ({
      ...order,
      items: items.filter((item) => item.orderId === order.id),
    }));

    return Response.json({ orders: result });
  } catch (error) {
    console.error("[orders] listing failed", error);
    return Response.json(
      { error: "دریافت سفارش‌ها موقتاً ممکن نیست" },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return Response.json(
        { error: "برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید" },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "بدنه درخواست نامعتبر است" },
        { status: 400 },
      );
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "اطلاعات ارسالی نامعتبر است",
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const rawDb = await getRawDb();
    const requestHash = await checkoutHash(data);
    const findSubmission = () =>
      rawDb
        .prepare(
          "SELECT s.user_id, s.order_id, s.request_hash, o.total_amount FROM order_submissions s JOIN orders o ON o.id=s.order_id WHERE s.request_key=?",
        )
        .bind(data.requestKey)
        .first<{
          user_id: number;
          order_id: number;
          request_hash: string;
          total_amount: number;
        }>();
    const existing = await findSubmission();
    if (existing) {
      if (existing.user_id !== user.id || existing.request_hash !== requestHash)
        return Response.json(
          { error: "شناسهٔ درخواست قبلاً برای سفارش دیگری استفاده شده است" },
          { status: 409 },
        );
      return Response.json({
        ok: true,
        orderId: existing.order_id,
        totalAmount: existing.total_amount,
      });
    }

    if (
      data.deliveryMethod === "ship" &&
      (!data.address || data.address.trim().length < 5)
    ) {
      return Response.json(
        { error: "برای ارسال با پیک، آدرس دقیق را وارد کنید" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const productIds = data.items.map((item) => item.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));
    const productMap = new Map(
      dbProducts.map((product) => [product.id, product]),
    );

    type NewOrderItem = {
      productId: number;
      productName: string;
      productCode: number;
      unitPrice: number;
      quantity: number;
    };
    let totalAmount = 0;
    const itemsForInsert: NewOrderItem[] = [];
    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        return Response.json(
          { error: "یکی از محصولات دیگر در فروشگاه موجود نیست" },
          { status: 409 },
        );
      }
      if (item.quantity > product.stock) {
        return Response.json(
          { error: `موجودی «${product.name}» برای تعداد درخواستی کافی نیست` },
          { status: 409 },
        );
      }
      totalAmount += sellingPrice(product.code, product.price) * item.quantity;
      itemsForInsert.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        unitPrice: sellingPrice(product.code, product.price),
        quantity: item.quantity,
      });
    }

    if (data.expectedTotal !== totalAmount)
      return Response.json(
        {
          error:
            "قیمت سبد تغییر کرده است؛ به سبد برگردید و مبلغ جدید را بررسی کنید",
        },
        { status: 409 },
      );

    try {
      // D1 executes the entire batch in one transaction. Trigger guards and
      // reservation run inside it; any conflict rolls the order back too.
      await rawDb.batch([
        rawDb
          .prepare(
            "INSERT INTO orders (user_id, status, total_amount, full_name, phone, delivery_method, address, receipt_image) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            user.id,
            totalAmount,
            data.fullName,
            data.phone,
            data.deliveryMethod,
            data.deliveryMethod === "ship" ? data.address : null,
            data.receiptImage,
          ),
        rawDb
          .prepare(
            "INSERT INTO order_submissions (request_key, user_id, order_id, request_hash) VALUES (?, ?, last_insert_rowid(), ?)",
          )
          .bind(data.requestKey, user.id, requestHash),
        ...itemsForInsert.map((item) => {
          const basePrice = productMap.get(item.productId)!.price;
          return rawDb
            .prepare(
              "INSERT INTO order_items (order_id, product_id, product_name, product_code, unit_price, quantity) VALUES ((SELECT order_id FROM order_submissions WHERE request_key=? AND user_id=?), ?, (SELECT name FROM products WHERE id=?), (SELECT code FROM products WHERE id=?), COALESCE((SELECT CASE WHEN price=? THEN ? ELSE -1 END FROM products WHERE id=?), -1), ?)",
            )
            .bind(
              data.requestKey,
              user.id,
              item.productId,
              item.productId,
              item.productId,
              basePrice,
              item.unitPrice,
              item.productId,
              item.quantity,
            );
        }),
      ]);
    } catch (error) {
      const prior = await findSubmission();
      if (
        prior &&
        prior.user_id === user.id &&
        prior.request_hash === requestHash
      )
        return Response.json({
          ok: true,
          orderId: prior.order_id,
          totalAmount: prior.total_amount,
        });
      const detail = String(error);
      if (
        detail.includes("CHECKOUT_STOCK_CHANGED") ||
        detail.includes("CHECKOUT_PRICE_CHANGED")
      )
        return Response.json(
          {
            error:
              "قیمت یا موجودی تغییر کرده است؛ سبد خرید را دوباره بررسی کنید",
          },
          { status: 409 },
        );
      throw error;
    }
    const saved = await findSubmission();
    if (!saved) throw new Error("Order submission missing after batch");
    const orderId = saved.order_id;

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
      // Notification failure must never make a committed order look unsuccessful.
      try {
        await db
          .update(orders)
          .set({ telegramStatus: "failed" })
          .where(eq(orders.id, orderId));
      } catch {
        /* best effort */
      }
    }

    return Response.json({ ok: true, orderId, totalAmount });
  } catch (error) {
    console.error("[orders] checkout failed", error);
    return Response.json(
      {
        error:
          "ثبت سفارش موقتاً در دسترس نیست؛ دوباره تلاش کنید. سبد شما حفظ شده است.",
      },
      { status: 503 },
    );
  }
}
