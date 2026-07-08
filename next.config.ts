import type { NextConfig } from "next";

// Public assets are served from the R2 bucket's custom domain (R2_PUBLIC_BASE_URL).
// Derive the hostname for next/image at config time; fall back to the known custom
// domain so the build has a valid pattern even when the env isn't set (e.g. CI).
const publicHost = (() => {
  try {
    return new URL(process.env.R2_PUBLIC_BASE_URL ?? "https://assets.mananssh.com").hostname;
  } catch {
    return "assets.mananssh.com";
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Public R2 objects (portfolio photo, post covers, etc.) optimized via next/image.
    remotePatterns: [{ protocol: "https", hostname: publicHost }],
  },
};

export default nextConfig;
