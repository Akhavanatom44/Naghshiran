/** Restrict post-login navigation to known internal destinations. */
export function safeNextPath(value: string | undefined): string {
  if (!value || /[\\\u0000-\u0020]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://naghshiran.invalid");
    if (!value.startsWith("/") || url.origin !== "https://naghshiran.invalid")
      return "/";
    if (
      !/^\/(?:cart|checkout|account|orders(?:\/[1-9]\d*)?)?$/.test(url.pathname)
    )
      return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
