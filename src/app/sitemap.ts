import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://binectics.com";

  const routes: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    // Core pages
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },

    // Discovery
    { path: "/gyms", changeFrequency: "daily", priority: 0.9 },
    { path: "/trainers", changeFrequency: "daily", priority: 0.9 },
    { path: "/dietitians", changeFrequency: "daily", priority: 0.9 },
    { path: "/marketplace", changeFrequency: "daily", priority: 0.8 },
    { path: "/search", changeFrequency: "daily", priority: 0.8 },
    { path: "/categories", changeFrequency: "monthly", priority: 0.7 },
    { path: "/countries", changeFrequency: "monthly", priority: 0.7 },

    // Auth
    { path: "/login", changeFrequency: "yearly", priority: 0.5 },
    { path: "/register", changeFrequency: "yearly", priority: 0.6 },
    { path: "/forgot-password", changeFrequency: "yearly", priority: 0.3 },

    // Info
    { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
    { path: "/help", changeFrequency: "monthly", priority: 0.5 },
    { path: "/qr-help", changeFrequency: "monthly", priority: 0.4 },

    // Company
    { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
    { path: "/partners", changeFrequency: "monthly", priority: 0.6 },
    { path: "/press", changeFrequency: "monthly", priority: 0.4 },

    // Legal
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
    { path: "/security", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
