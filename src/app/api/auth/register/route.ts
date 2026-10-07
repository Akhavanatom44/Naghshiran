import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")
    .max(32, "نام کاربری بسیار طولانی است")
    .regex(/^[a-zA-Z0-9_]+$/, "نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد و _ باشد"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  fullName: z.string().trim().min(2, "نام و نام خانوادگی را وارد کنید").max(128),
  phone: z.string().trim().min(8, "شماره تلفن معتبر وارد کنید").max(32),
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

  const { username, password, fullName, phone } = parsed.data;

  let inserted;
  try {
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return Response.json({ error: "این نام کاربری قبلاً ثبت شده است" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    inserted = await db
      .insert(users)
      .values({ username, passwordHash, fullName, phone })
      .returning({ id: users.id });
  } catch {
    return Response.json(
      { error: "سرویس احراز هویت موقتاً در دسترس نیست؛ لطفاً دوباره تلاش کنید" },
      { status: 503 }
    );
  }

  const userId = inserted[0].id;
  await setSessionCookie(userId);

  return Response.json({ ok: true });
}
