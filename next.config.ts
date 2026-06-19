import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Public GCS objects (portfolio photo, etc.) optimized via next/image.
    remotePatterns: [{ protocol: "https", hostname: "storage.googleapis.com" }],
  },
};

export default nextConfig;
