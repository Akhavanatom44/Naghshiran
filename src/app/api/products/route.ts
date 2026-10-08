import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CATALOG_PRODUCTS } from "@/data/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));

    return Response.json({
      products: rows.length ? rows : CATALOG_PRODUCTS.map((product) => ({ ...product, canPurchase: false })),
    });
  } catch (error) {
    console.warn("[products] using built-in catalog because PostgreSQL is unavailable", error);
    return Response.json({
      products: CATALOG_PRODUCTS.map((product) => ({ ...product, canPurchase: false })),
      databaseConfigured: false,
    });
  }
}
