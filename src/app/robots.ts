import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only areas with nothing for a crawler at all. Sign-in, checkout,
        // verification and status pages are NOT blocked here: they send
        // X-Robots-Tag: noindex (src/lib/routing/indexing.ts), and a crawler
        // that robots.txt turns away never sees that header, so a blocked
        // URL can still be listed from links alone.
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
