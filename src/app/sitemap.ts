import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { fetchSitemapListingEntries } from "@/lib/marketplace/publicListing";

// Rebuilt hourly, so a listing published since the last build appears
// without a deploy. Keep equal to SITEMAP_REVALIDATE_SECONDS (a segment
// config must be a literal).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const routes: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    // Core pages
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },

    // Discovery
    { path: "/marketplace", changeFrequency: "daily", priority: 0.9 },

    // Who it is for, and what it does
    { path: "/for-gyms", changeFrequency: "monthly", priority: 0.8 },
    { path: "/for-trainers", changeFrequency: "monthly", priority: 0.8 },
    { path: "/for-dietitians", changeFrequency: "monthly", priority: 0.8 },
    { path: "/for-members", changeFrequency: "monthly", priority: 0.7 },
    { path: "/features/dashboard", changeFrequency: "monthly", priority: 0.6 },
    { path: "/features/qr-checkin", changeFrequency: "monthly", priority: 0.6 },
    { path: "/features/client-journals", changeFrequency: "monthly", priority: 0.6 },
    { path: "/features/multi-currency", changeFrequency: "monthly", priority: 0.6 },

    // Info
    { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
    { path: "/help", changeFrequency: "monthly", priority: 0.5 },
    { path: "/qr-help", changeFrequency: "monthly", priority: 0.4 },

    // Legal (Terms & Cookies are tabs inside /privacy)
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Published provider profiles. The fetch already swallows API failures;
  // the catch is a second guard so nothing here can fail the sitemap.
  const listingEntries = await fetchSitemapListingEntries().catch(() => []);

  return [...staticEntries, ...listingEntries];
}
