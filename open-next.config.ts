import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cloudflare Workers Builds runs npm run build. Keep that command as the
// OpenNext entry point, and explicitly tell OpenNext which script performs
// the underlying Next.js build so it never recurses back into itself.
const config = {
  ...defineCloudflareConfig(),
  buildCommand: "npm run build:next",
};

export default config;
