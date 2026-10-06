import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { SITE_URL } from "@/lib/site-url";

afterEach(() => {
  vi.unstubAllGlobals();
});

// The live sitemap once listed every page under http://localhost:3001.
describe("robots.txt and sitemap", () => {
  it("point at the site's public address", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    for (const entry of await sitemap()) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(entry.url).not.toMatch(/localhost|127\.0\.0\.1/);
    }
  });

  it("still lists the static pages when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/marketplace`);
    expect(urls.some((u) => /\/marketplace\/./.test(u))).toBe(false);
  });

  it("adds published listings at their slug address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          data: {
            listings: [{ _id: "6ab9460eda0cf24c555d827b", slug: "strength-coach", account_type: "personal_trainer" }],
            pagination: { page: 1, limit: 50, total: 1, total_pages: 1 },
          },
        }),
      ),
    );
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/marketplace/strength-coach`);
  });
});
