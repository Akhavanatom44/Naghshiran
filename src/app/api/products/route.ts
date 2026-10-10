import { presentProduct } from "@/lib/product-pricing";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { CATALOG_PRODUCTS } from "@/data/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.code));

    return Response.json({
      products: rows.map(presentProduct),
      databaseConfigured: true,
    });
  } catch (error) {
    console.warn("[products] using built-in catalog because the D1 database is unavailable", error);
    return Response.json({
      products: CATALOG_PRODUCTS.map((product) => presentProduct({ ...product, canPurchase: false })),
      databaseConfigured: false,
    });
  }
}
