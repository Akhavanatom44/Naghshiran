import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Gives `next dev` access to the Workers bindings (D1, vars, ...) declared in
// wrangler.jsonc. No-op outside the local dev server.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {};

export default nextConfig;
