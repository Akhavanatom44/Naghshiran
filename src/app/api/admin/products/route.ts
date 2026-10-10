import { getDb } from "@/db";
import { products } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/admin";
import { productSchema, productUpdateSchema } from "@/lib/seller-products";
import { presentProduct } from "@/lib/product-pricing";

export async function GET(req: Request) {
  try {
    if (!(await getAdminUser()))
      return Response.json({ error: "دسترسی مجاز نیست" }, { status: 403 });
    const db = await getDb();
    const code = new URL(req.url).searchParams.get("code");
    const rows = await db
      .select()
      .from(products)
      .where(code ? eq(products.code, Number(code)) : undefined)
      .orderBy(asc(products.code));
    return Response.json({
      products: rows.map((p) => ({
        ...p,
        discountPercent: presentProduct(p).discountPercent,
      })),
    });
  } catch (error) {
    console.error("[admin/products]", error);
    return Response.json({ error: "دریافت محصولات ممکن نشد" }, { status: 503 });
  }
}

async function save(req: Request, editing: boolean) {
  try {
    if (!(await getAdminUser()))
      return Response.json({ error: "دسترسی مجاز نیست" }, { status: 403 });
    const body = await req.json().catch(() => null);
    const parsed = (editing ? productUpdateSchema : productSchema).safeParse(
      body,
    );
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" },
        { status: 400 },
      );
    const data = productSchema.parse(parsed.data);
    const db = await getDb();
    if (editing) {
      const { id, expectedUpdatedAt, expectedStock } =
        productUpdateSchema.parse(parsed.data);
      const rows = await db
        .update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(products.id, id),
            eq(products.updatedAt, new Date(expectedUpdatedAt)),
            eq(products.stock, expectedStock),
          ),
        )
        .returning();
      if (!rows.length)
        return Response.json(
          {
            error:
              "محصول یا موجودی تغییر کرده است؛ دوباره محصول را باز کنید و تغییرات را اعمال کنید",
          },
          { status: 409 },
        );
      return Response.json({ product: rows[0] });
    }
    const [product] = await db.insert(products).values(data).returning();
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if (
      [error, error instanceof Error ? error.cause : null].some((e) =>
        String(e).includes("UNIQUE"),
      )
    )
      return Response.json(
        { error: "این کد محصول قبلاً ثبت شده است" },
        { status: 409 },
      );
    console.error("[admin/products] save", error);
    return Response.json({ error: "ذخیره محصول ممکن نشد" }, { status: 503 });
  }
}
export const POST = (req: Request) => save(req, false);
export const PATCH = (req: Request) => save(req, true);

// Soft deletion preserves historical order references and permits restoration.
export async function DELETE(req: Request) {
  try {
    if (!(await getAdminUser()))
      return Response.json({ error: "دسترسی مجاز نیست" }, { status: 403 });
    const body = await req.json().catch(() => null);
    if (!Number.isSafeInteger(body?.id) || body.id < 1)
      return Response.json({ error: "شناسه نامعتبر" }, { status: 400 });
    const db = await getDb();
    const rows = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, body.id))
      .returning({ id: products.id });
    if (!rows.length)
      return Response.json({ error: "محصول پیدا نشد" }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "حذف محصول ممکن نشد" }, { status: 503 });
  }
}
