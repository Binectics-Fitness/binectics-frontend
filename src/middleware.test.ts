// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { SITE_HOST } from "@/lib/site-url";

function request(path: string, host: string, cookie?: string): NextRequest {
  const headers = new Headers({ host });
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`https://${host}${path}`, { headers });
}

describe("middleware X-Robots-Tag", () => {
  it("leaves pages on the canonical host indexable", async () => {
    const res = await middleware(request("/about", SITE_HOST));
    expect(res.headers.get("x-robots-tag")).toBeNull();
  });

  it.each(["main--binectics.netlify.app", "binectics.vercel.app", "binectics-frontend-app.azurewebsites.net"])(
    "keeps pages on the copy at %s out of search",
    async (host) => {
      const res = await middleware(request("/about", host));
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    },
  );

  it("marks redirects on a copy too", async () => {
    const res = await middleware(request("/dashboard", "binectics.vercel.app"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("marks the sign-in redirect from a private route on the canonical host", async () => {
    const res = await middleware(request("/dashboard", SITE_HOST));
    expect(res.status).toBe(307);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it.each(["/login", "/checkout", "/forms/f1"])(
    "keeps %s out of search on the canonical host too",
    async (path) => {
      const res = await middleware(request(path, SITE_HOST));
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    },
  );
});

describe("middleware provider-profile 404", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const rewrite = (res: Response) => res.headers.get("x-middleware-rewrite");

  it("sends a profile the API does not know to the 404 page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    const res = await middleware(request("/marketplace/no-such-gym", SITE_HOST));
    expect(rewrite(res)).toContain("/__profile-not-found");
  });

  it("sends a malformed segment to the 404 page without asking the API", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await middleware(request("/marketplace/not%20a%20listing!", SITE_HOST));
    expect(rewrite(res)).toContain("/__profile-not-found");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lets a real profile, an outage and the static routes through", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(rewrite(await middleware(request("/marketplace/iron-temple", SITE_HOST)))).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    expect(rewrite(await middleware(request("/marketplace/iron-temple", SITE_HOST)))).toBeNull();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(rewrite(await middleware(request("/marketplace/search", SITE_HOST)))).toBeNull();
    expect(rewrite(await middleware(request("/marketplace", SITE_HOST)))).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
