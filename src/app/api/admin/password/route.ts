import { getAdminUser } from "@/lib/admin";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { hashPassword, verifyPassword, setSessionCookie } from "@/lib/auth";
import { z } from "zod";
const schema = z.object({
  current: z.string().min(1).max(128),
  password: z
    .string()
    .min(12)
    .max(72)
    .refine((s) => new TextEncoder().encode(s).length <= 72),
});
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin)
      return Response.json({ error: "دسترسی مجاز نیست" }, { status: 403 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return Response.json(
        { error: "رمز جدید باید حداقل ۱۲ نویسه و حداکثر ۷۲ بایت باشد" },
        { status: 400 },
      );
    const db = await getDb();
    const [account] = await db
      .select()
      .from(users)
      .where(eq(users.id, admin.id));
    if (!(await verifyPassword(parsed.data.current, account.passwordHash)))
      return Response.json({ error: "رمز فعلی اشتباه است" }, { status: 400 });
    const changed = await db
      .update(users)
      .set({
        passwordHash: await hashPassword(parsed.data.password),
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(
        and(
          eq(users.id, admin.id),
          eq(users.passwordHash, account.passwordHash),
        ),
      )
      .returning({ id: users.id });
    if (!changed.length)
      return Response.json(
        { error: "رمز تغییر کرده است؛ دوباره وارد شوید" },
        { status: 409 },
      );
    await setSessionCookie(admin.id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "تغییر رمز انجام نشد" }, { status: 503 });
  }
}
