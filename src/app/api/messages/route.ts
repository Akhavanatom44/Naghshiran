import { getCurrentUser } from "@/lib/auth";
import { getRawDb } from "@/db";
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(true);
    if (!user)
      return Response.json({ error: "ابتدا وارد شوید" }, { status: 401 });
    const db = await getRawDb();
    const url = new URL(req.url);
    const count = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM messages WHERE recipient_id=? AND read_at IS NULL",
      )
      .bind(user.id)
      .first<{ count: number }>();
    const before =
      Number(url.searchParams.get("before")) || Number.MAX_SAFE_INTEGER;
    const rows = url.searchParams.has("count")
      ? []
      : (
          await db
            .prepare(
              "SELECT id, body, read_at AS readAt, created_at AS createdAt FROM messages WHERE recipient_id=? AND id < ? ORDER BY id DESC LIMIT 50",
            )
            .bind(user.id, before)
            .all()
        ).results;
    return Response.json({ messages: rows, unread: count?.count ?? 0 });
  } catch {
    return Response.json({ error: "دریافت پیام‌ها ممکن نشد" }, { status: 503 });
  }
}
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser(true);
    if (!user)
      return Response.json({ error: "ابتدا وارد شوید" }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!Number.isSafeInteger(body?.id) || body.id < 1)
      return Response.json({ error: "شناسه نامعتبر" }, { status: 400 });
    const db = await getRawDb();
    const result = await db
      .prepare(
        "UPDATE messages SET read_at=COALESCE(read_at, ?) WHERE id=? AND recipient_id=? RETURNING id",
      )
      .bind(Date.now(), body.id, user.id)
      .first();
    if (!result)
      return Response.json({ error: "پیام پیدا نشد" }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "ثبت وضعیت پیام ممکن نشد" }, { status: 503 });
  }
}
