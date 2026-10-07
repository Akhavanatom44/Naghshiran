import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "نام کاربری و رمز عبور را وارد کنید" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  let rows;
  try {
    rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  } catch {
    return Response.json(
      { error: "سرویس احراز هویت موقتاً در دسترس نیست؛ لطفاً دوباره تلاش کنید" },
      { status: 503 }
    );
  }
  const user = rows[0];

  if (!user) {
    return Response.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  await setSessionCookie(user.id);

  return Response.json({ ok: true });
}
