import { z } from "zod";
import { normalizeIranianMobile } from "./phone";

export const checkoutSchema = z
  .object({
    requestKey: z.string().uuid(),
    expectedTotal: z.number().int().nonnegative(),
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().positive().max(99),
        }),
      )
      .min(1, "سبد خرید شما خالی است")
      .max(100)
      .refine(
        (items) =>
          new Set(items.map((item) => item.productId)).size === items.length,
        "سبد خرید شامل کالای تکراری است",
      ),
    fullName: z
      .string()
      .trim()
      .min(2, "نام و نام خانوادگی را وارد کنید")
      .max(128),
    phone: z
      .string()
      .trim()
      .transform((value, ctx) => {
        const normalized = normalizeIranianMobile(value);
        if (!normalized) {
          ctx.addIssue({
            code: "custom",
            message: "شماره موبایل معتبر وارد کنید",
          });
          return z.NEVER;
        }
        return normalized;
      }),
    deliveryMethod: z.enum(["ship", "pickup"]),
    address: z.string().trim().max(500).optional().nullable(),
    receiptImage: z
      .string()
      .max(8_000_000, "حجم تصویر فیش زیاد است")
      .regex(
        /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
        "فیش باید تصویر JPEG، PNG یا WebP معتبر باشد",
      ),
  })
  .refine(
    (data) =>
      data.deliveryMethod !== "ship" || (data.address?.length ?? 0) >= 5,
    "آدرس دقیق را وارد کنید",
  );

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export async function checkoutHash(data: CheckoutInput): Promise<string> {
  const canonical = {
    ...data,
    requestKey: undefined,
    items: [...data.items].sort((a, b) => a.productId - b.productId),
  };
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(canonical)),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
