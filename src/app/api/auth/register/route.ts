import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  hashPassword,
  setSessionCookie,
  assertSessionConfigured,
} from "@/lib/auth";
import { normalizeIranianMobile } from "@/lib/phone";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")
    .max(32, "نام کاربری بسیار طولانی است")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد و _ باشد",
    )
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(128)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "رمز عبور باید حداکثر ۷۲ بایت باشد (برای حروف فارسی کوتاه‌تر انتخاب کنید)",
    ),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizeIranianMobile(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "شماره موبایل معتبر وارد کنید (مثلاً 09131147897)",
        });
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
    return Response.json(
      { error: "بدنه درخواست نامعتبر است" },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" },
      { status: 400 },
    );
  }

  // Fail before creating an account if cookies cannot be signed.
  try {
    assertSessionConfigured();
  } catch {
    return Response.json(
      {
        error: "ورود و ثبت‌نام موقتاً آماده نیست؛ لطفاً با فروشگاه تماس بگیرید",
      },
      { status: 503 },
    );
  }
  const { username, password, phone, fullName } = parsed.data;
  let userId: number;

  try {
    const db = await getDb();
    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.username}) = ${username}`)
      .limit(1);
    if (existingUsername.length > 0) {
      return Response.json(
        { error: "این نام کاربری قبلاً ثبت شده است" },
        { status: 409 },
      );
    }

    const existingPhone = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    if (existingPhone.length > 0) {
      return Response.json(
        {
          error:
            "با این شماره موبایل قبلاً حساب ساخته شده است؛ از بخش ورود استفاده کنید",
          code: "PHONE_EXISTS",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const inserted =
      await db.run(sql`INSERT INTO users (username, password_hash, full_name, phone)
      SELECT ${username}, ${passwordHash}, ${fullName || null}, ${phone}
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(username) = ${username} OR phone = ${phone})`);
    if (inserted.meta.changes !== 1)
      return Response.json(
        { error: "نام کاربری یا شماره موبایل قبلاً ثبت شده است" },
        { status: 409 },
      );
    userId = Number(inserted.meta.last_row_id);
  } catch (error) {
    // SQLite (D1) reports a violated UNIQUE constraint this way.
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return Response.json(
        { error: "نام کاربری یا شماره موبایل قبلاً ثبت شده است" },
        { status: 409 },
      );
    }
    console.error("[auth/register] database error", error);
    const detail = error instanceof Error ? error.message : String(error);
    const bindingMissing = detail.includes("binding `DB` is missing");
    return Response.json(
      {
        error: bindingMissing
          ? "پایگاه داده در دسترس نیست؛ اتصال D1 را در wrangler.jsonc بررسی کنید"
          : "ثبت‌نام انجام نشد؛ لطفاً چند لحظه بعد دوباره تلاش کنید یا با فروشگاه تماس بگیرید",
      },
      { status: 503 },
    );
  }

  try {
    await setSessionCookie(userId);
  } catch (error) {
    console.error("[auth/register] session error", error);
    return Response.json(
      {
        error: "حساب ساخته شد، اما ورود کامل نشد؛ از بخش ورود دوباره تلاش کنید",
      },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}
