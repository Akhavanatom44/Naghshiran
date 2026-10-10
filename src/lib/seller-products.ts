import { z } from "zod";
export const productSchema = z.object({
  code: z.number().int().min(1).max(999999999),
  name: z.string().trim().min(2, "نام محصول را وارد کنید").max(200),
  description: z.string().trim().min(1, "توضیحات محصول را وارد کنید").max(5000),
  category: z.string().trim().min(1).max(64),
  price: z.number().int().min(1).max(1_000_000_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  discountPercent: z.number().int().min(0).max(99),
  isActive: z.boolean(),
  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((url) => {
      if (/^\/(?:images\/|api\/product-images\/)[a-zA-Z0-9/_.-]+$/.test(url))
        return true;
      try {
        return new URL(url).protocol === "https:";
      } catch {
        return false;
      }
    }, "عکس را بارگذاری کنید یا نشانی معتبر HTTPS وارد کنید"),
});
export const productUpdateSchema = productSchema.extend({
  id: z.number().int().positive(),
  expectedUpdatedAt: z.string().datetime(),
  expectedStock: z.number().int().nonnegative(),
});
