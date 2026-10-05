import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

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
          "/maintenance",
          "/status",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
