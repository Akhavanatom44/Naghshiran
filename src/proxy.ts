import { NextRequest, NextResponse } from "next/server";
export function proxy(req: NextRequest) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    let foreign = req.headers.get("sec-fetch-site") === "cross-site";
    if (origin) {
      try {
        foreign ||= new URL(origin).host !== host;
      } catch {
        foreign = true;
      }
    }
    if (foreign)
      return NextResponse.json(
        { error: "درخواست از مبدأ غیرمجاز است" },
        { status: 403 },
      );
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/messages/:path*"],
};
