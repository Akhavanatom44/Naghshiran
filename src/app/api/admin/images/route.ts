import { getAdminUser } from "@/lib/admin";
import { getRawDb } from "@/db";
export async function POST(req: Request) {
  try {
    if (!(await getAdminUser()))
      return Response.json({ error: "دسترسی مجاز نیست" }, { status: 403 });
    const body = await req.json().catch(() => null);
    const data = body?.image;
    if (
      typeof data !== "string" ||
      data.length > 400_000 ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data)
    )
      return Response.json(
        { error: "تصویر نامعتبر یا بیش از حد بزرگ است" },
        { status: 400 },
      );
    const header = atob(data.split(",")[1]).slice(0, 12);
    if (!(
      header.startsWith("\xff\xd8\xff") ||
      header.startsWith("\x89PNG\r\n\x1a\n") ||
      (header.startsWith("RIFF") && header.endsWith("WEBP"))
    ))
      return Response.json({ error: "فایل تصویر معتبر نیست" }, { status: 400 });
    const id = crypto.randomUUID();
    const db = await getRawDb();
    await db
      .prepare("INSERT INTO product_images (id, data) VALUES (?, ?)")
      .bind(id, data)
      .run();
    return Response.json(
      { imageUrl: `/api/product-images/${id}` },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "بارگذاری تصویر ممکن نشد" }, { status: 503 });
  }
}
