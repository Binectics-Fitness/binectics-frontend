import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
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

    // Auth
    { path: "/login", changeFrequency: "yearly", priority: 0.5 },
    { path: "/login?mode=signup", changeFrequency: "yearly", priority: 0.6 },
    { path: "/forgot-password", changeFrequency: "yearly", priority: 0.3 },

    // Info
    { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
    { path: "/help", changeFrequency: "monthly", priority: 0.5 },
    { path: "/qr-help", changeFrequency: "monthly", priority: 0.4 },

    // Legal (Terms & Cookies are tabs inside /privacy)
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
