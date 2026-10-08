import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// buildCommand is explicit so OpenNext never calls "npm run build" recursively.
export default {
  ...defineCloudflareConfig(),
  buildCommand: "npx next build",
};
