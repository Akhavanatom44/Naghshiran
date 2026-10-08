import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { normalizeIranianMobile } from "@/lib/phone";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")
    .max(32, "نام کاربری بسیار طولانی است")
    .regex(/^[a-zA-Z0-9_]+$/, "نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد و _ باشد")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد").max(128),
  phone: z.string().trim().transform((value, ctx) => {
    const normalized = normalizeIranianMobile(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "شماره موبایل معتبر وارد کنید (مثلاً 09131147897)" });
      return z.NEVER;
    }
    return normalized;
  }),
  fullName: z.string().trim().max(128).optional(),
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
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" },
      { status: 400 }
    );
  }

  const { username, password, phone, fullName } = parsed.data;
  let userId: number;

  try {
    const existingUsername = await db.select({ id: users.id }).from(users).where(sql`lower(${users.username}) = ${username}`).limit(1);
    if (existingUsername.length > 0) {
      return Response.json({ error: "این نام کاربری قبلاً ثبت شده است" }, { status: 409 });
    }

    const existingPhone = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
    if (existingPhone.length > 0) {
      return Response.json(
        { error: "با این شماره موبایل قبلاً حساب ساخته شده است؛ از بخش ورود استفاده کنید", code: "PHONE_EXISTS" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const inserted = await db
      .insert(users)
      .values({ username, passwordHash, fullName: fullName || null, phone })
      .returning({ id: users.id });
    userId = inserted[0].id;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return Response.json({ error: "نام کاربری یا شماره موبایل قبلاً ثبت شده است" }, { status: 409 });
    }
    console.error("[auth/register] database error", error);
    return Response.json(
      { error: "پایگاه داده در دسترس نیست؛ تنظیم DATABASE_URL را بررسی کنید" },
      { status: 503 }
    );
  }

  try {
    await setSessionCookie(userId);
  } catch (error) {
    console.error("[auth/register] session error", error);
    return Response.json({ error: "حساب ساخته شد؛ تنظیم SESSION_SECRET را بررسی و دوباره وارد شوید" }, { status: 503 });
  }

  return Response.json({ ok: true });
}
