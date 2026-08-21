import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [60, 75, 85],
    // Allow next/image to load anything served under our public MinIO CDN
    // (presigned URLs come back with X-Amz-* query params — those are fine,
    // Next validates only host + path). Any host not listed here is rejected
    // at build time — add new hosts explicitly.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.elinaclothes.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/elina/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
