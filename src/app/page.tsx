import { presentProduct } from "@/lib/product-pricing";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ProductCatalog from "@/components/ProductCatalog";
import type { ProductForCard } from "@/components/ProductCard";
import { CATALOG_PRODUCTS } from "@/data/catalog";
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: ProductForCard[] = [];
  let databaseAvailable = true;
  let databaseIsEmpty = false;

  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));

    if (rows.length === 0) {
      databaseIsEmpty = true;
      items = CATALOG_PRODUCTS.map((product) => presentProduct({ ...product, canPurchase: false }));
    } else {
      items = rows.map((product) => presentProduct({
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        category: product.category,
      }));
    }
  } catch (error) {
    databaseAvailable = false;
    console.warn("[home] D1 database unavailable; showing the built-in catalog", error);
    items = CATALOG_PRODUCTS.map((product) => presentProduct({ ...product, canPurchase: false }));
  }

  return (
    <>
      {(!databaseAvailable || databaseIsEmpty) && (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-xs leading-6 text-amber-100/90">
            {databaseAvailable
              ? "فهرست محصولات نمایش داده می‌شود؛ برای فعال‌شدن ثبت سفارش، کاتالوگ باید با دستور npm run db:seed در پایگاه داده ثبت شود."
              : "فهرست محصولات برای مشاهده در دسترس است؛ ثبت‌نام و سفارش پس از تنظیم اتصال پایگاه داده‌ی فروشگاه فعال می‌شود."}
            <a href={STORE_PHONE_TEL} className="mr-2 font-black text-amber-300 underline underline-offset-4" dir="ltr">
              {STORE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}
      <ProductCatalog products={items} />
    </>
  );
}
