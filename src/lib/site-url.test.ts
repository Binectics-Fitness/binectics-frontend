import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_URL, isCanonicalHost, resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("uses the production address when nothing is set", () => {
    expect(resolveSiteUrl({})).toBe(DEFAULT_SITE_URL);
    expect(resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "  " })).toBe(DEFAULT_SITE_URL);
  });

  it("never defaults to a local address", () => {
    expect(new URL(DEFAULT_SITE_URL).protocol).toBe("https:");
    expect(DEFAULT_SITE_URL).not.toMatch(/localhost|127\.0\.0\.1/);
  });

  it("honours an override and drops any path or trailing slash", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "https://app.binectics.com/" })).toBe(
      "https://app.binectics.com",
    );
  });

  it("allows localhost for local work", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "http://localhost:3001" })).toBe(
      "http://localhost:3001",
    );
  });

  it.each([
    ["Netlify", { NETLIFY: "true" }],
    ["Vercel", { VERCEL: "1" }],
    ["Azure", { WEBSITE_SITE_NAME: "binectics-frontend-app" }],
  ])("refuses localhost on a %s deploy", (_name, hostEnv) => {
    expect(() =>
      resolveSiteUrl({ ...hostEnv, NEXT_PUBLIC_APP_URL: "http://localhost:3001" }),
    ).toThrow(/hosted deploy/);
  });

  it("refuses an address that is not an absolute http(s) URL", () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "binectics.netlify.app" })).toThrow(
      /absolute URL/,
    );
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_APP_URL: "ftp://binectics.com" })).toThrow(
      /http\(s\)/,
    );
  });
});

describe("isCanonicalHost", () => {
  const site = "binectics.netlify.app";

  it("accepts the canonical host, in any case", () => {
    expect(isCanonicalHost("binectics.netlify.app", site)).toBe(true);
    expect(isCanonicalHost("Binectics.Netlify.App", site)).toBe(true);
  });

  it.each([
    "main--binectics.netlify.app",
    "deploy-preview-12--binectics.netlify.app",
    "binectics.vercel.app",
    "binectics-frontend-app.azurewebsites.net",
    "localhost:3001",
  ])("rejects the copy at %s", (host) => {
    expect(isCanonicalHost(host, site)).toBe(false);
  });

  it("rejects a request with no host", () => {
    expect(isCanonicalHost(null, site)).toBe(false);
  });
});

describe("SITE_URL at run time", () => {
  it("falls back to the production address instead of throwing", async () => {
    vi.resetModules();
    vi.stubEnv("NETLIFY", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3001");
    try {
      const mod = await import("./site-url");
      expect(mod.SITE_URL).toBe(DEFAULT_SITE_URL);
      expect(() => mod.resolveSiteUrl()).toThrow(/hosted deploy/);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
