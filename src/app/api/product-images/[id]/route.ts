import { getRawDb } from "@/db";
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const db = await getRawDb();
    const image = await db
      .prepare("SELECT data FROM product_images WHERE id=?")
      .bind(id)
      .first<{ data: string }>();
    if (!image) return new Response(null, { status: 404 });
    const [prefix, content] = image.data.split(",");
    return new Response(
      Uint8Array.from(atob(content), (c) => c.charCodeAt(0)),
      {
        headers: {
          "Content-Type": prefix.slice(5).split(";")[0],
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return new Response(null, { status: 503 });
  }
}
