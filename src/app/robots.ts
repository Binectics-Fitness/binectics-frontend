import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://binectics.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/checkout/",
          "/api/",
          "/verify-email/",
          "/unsubscribe/",
          "/maintenance",
          "/status",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
