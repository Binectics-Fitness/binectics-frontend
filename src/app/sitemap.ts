import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://binectics.com";

  const staticRoutes = [
    "",
    "/about",
    "/how-it-works",
    "/pricing",
    "/faq",
    "/contact",
    "/blog",
    "/careers",
    "/partners",
    "/press",
    "/privacy",
    "/terms",
    "/cookies",
    "/security",
    "/help",
    "/qr-help",
    "/gyms",
    "/trainers",
    "/dietitians",
    "/categories",
    "/countries",
    "/marketplace",
    "/search",
    "/login",
    "/register",
    "/forgot-password",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : route === "/pricing" ? 0.9 : 0.7,
  }));
}
