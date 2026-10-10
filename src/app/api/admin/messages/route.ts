import { getAdminUser } from "@/lib/admin";
import { getRawDb } from "@/db";
import { z } from "zod";
const schema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  body: z.string().trim().min(1).max(2000),
});
export async function GET(req: Request) {
  try {
    if (!(await getAdminUser()))
      return Response.json({ error: "دسترسی مجاز نیست" }, { status: 403 });
    const db = await getRawDb();
    const before =
      Number(new URL(req.url).searchParams.get("before")) ||
      Number.MAX_SAFE_INTEGER;
    const rows = await db
      .prepare(
        "SELECT m.id, m.body, m.created_at AS createdAt, m.read_at AS readAt, u.username FROM messages m JOIN users u ON u.id=m.recipient_id WHERE m.id < ? ORDER BY m.id DESC LIMIT 50",
      )
      .bind(before)
      .all();
    return Response.json({ messages: rows.results });
  } catch {
    return Response.json({ error: "دریافت پیام‌ها ممکن نشد" }, { status: 503 });
  }
}
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin)
      return Response.json({ error: "دسترسی مجاز نیست" }, { status: 403 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return Response.json(
        { error: "نام کاربری و پیام (حداکثر ۲۰۰۰ نویسه) را وارد کنید" },
        { status: 400 },
      );
    const db = await getRawDb();
    const user = await db
      .prepare("SELECT id FROM users WHERE lower(username)=? AND is_admin=0")
      .bind(parsed.data.username)
      .first<{ id: number }>();
    if (!user)
      return Response.json(
        { error: "کاربری با این نام پیدا نشد" },
        { status: 404 },
      );
    await db
      .prepare(
        "INSERT INTO messages (recipient_id, sender_id, body, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(user.id, admin.id, parsed.data.body, Date.now())
      .run();
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "ارسال پیام ممکن نشد" }, { status: 503 });
  }
}
