import { getCloudflareContext } from "@opennextjs/cloudflare";

export function runtimeEnv(
  name: "SESSION_SECRET" | "TELEGRAM_BOT_TOKEN" | "TELEGRAM_ADMIN_CHAT_IDS",
) {
  try {
    const value = getCloudflareContext().env[name];
    if (typeof value === "string") return value;
  } catch {
    /* Node build/test environment: use process.env. */
  }
  return process.env[name];
}
