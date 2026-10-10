import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser(true);
    return Response.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "دریافت حساب موقتاً ممکن نیست" },
      { status: 503 },
    );
  }
}
