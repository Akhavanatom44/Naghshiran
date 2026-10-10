import { getRawDb } from "@/db";
/** Shared D1 counters, not per-isolate memory. No plaintext username/IP stored. */
export async function reserveLoginAttempt(username: string, req: Request) {
  const db = await getRawDb();
  const now = Date.now();
  const keys = ["account:" + username];
  // Cloudflare overwrites this header on the deployed Worker.
  const ip = req.headers.get("cf-connecting-ip");
  if (ip) keys.push("ip:" + ip);
  for (const value of keys) {
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value),
    );
    const key = Array.from(new Uint8Array(hash), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const row = await db
      .prepare(
        "INSERT INTO login_attempts (key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at < ? THEN 1 ELSE attempts+1 END, expires_at=CASE WHEN expires_at < ? THEN excluded.expires_at ELSE expires_at END RETURNING attempts",
      )
      .bind(key, now + 15 * 60_000, now, now)
      .first<{ attempts: number }>();
    if ((row?.attempts ?? 1000) > (value.startsWith("ip:") ? 60 : 15))
      return false;
  }
  await db
    .prepare("DELETE FROM login_attempts WHERE expires_at < ?")
    .bind(now)
    .run();
  return true;
}
