import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { SITE_URL } from "@/lib/site-url";

// The live sitemap once listed every page under http://localhost:3001.
describe("robots.txt and sitemap", () => {
  it("point at the site's public address", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    for (const entry of sitemap()) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(entry.url).not.toMatch(/localhost|127\.0\.0\.1/);
    }
  });
});
