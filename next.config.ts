import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  turbopack: { root: resolve(import.meta.dirname ?? ".") },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com", // AWS S3 for uploaded images
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // For demo/placeholder images
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Cloudinary for provider photos
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Strict mode for better development experience
  reactStrictMode: true,

  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // Environment variables that should be available on client
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  },

  // Experimental features (Next.js 16)
  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
  },


  // Headers for security
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Same-origin API proxy — host-agnostic version of the netlify.toml
  // redirect. The httpOnly auth cookies must be FIRST-party (set on this
  // site's own domain) or the Next middleware can't see access_token and
  // every login bounces back to /login. netlify.toml only applies on
  // Netlify; this rewrite makes Vercel/preview/any-host deployments work
  // the same way. Requires NEXT_PUBLIC_API_URL to be UNSET (or relative)
  // on those hosts so apiClient uses the relative /api/v1 path.
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination:
          "https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1/:path*",
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
