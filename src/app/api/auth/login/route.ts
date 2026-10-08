import { getDb } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().trim().min(1).max(64).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
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
  let user;
  try {
    const db = await getDb();
    const rows = await db.select().from(users).where(sql`lower(${users.username}) = ${username}`).limit(1);
    user = rows[0];
  } catch (error) {
    console.error("[auth/login] database error", error);
    return Response.json(
      { error: "پایگاه داده در دسترس نیست؛ اتصال D1 را در wrangler.jsonc بررسی کنید" },
      { status: 503 }
    );
  }

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  try {
    await setSessionCookie(user.id);
  } catch (error) {
    console.error("[auth/login] session error", error);
    return Response.json({ error: "تنظیم SESSION_SECRET را بررسی کنید" }, { status: 503 });
  }

  return Response.json({ ok: true });
}
