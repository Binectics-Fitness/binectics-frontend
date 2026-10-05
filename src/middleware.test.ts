// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { SITE_HOST } from "@/lib/site-url";

function request(path: string, host: string, cookie?: string): NextRequest {
  const headers = new Headers({ host });
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`https://${host}${path}`, { headers });
}

describe("middleware X-Robots-Tag", () => {
  it("leaves pages on the canonical host indexable", () => {
    const res = middleware(request("/about", SITE_HOST));
    expect(res.headers.get("x-robots-tag")).toBeNull();
  });

  it.each(["main--binectics.netlify.app", "binectics.vercel.app", "binectics-frontend-app.azurewebsites.net"])(
    "keeps pages on the copy at %s out of search",
    (host) => {
      const res = middleware(request("/about", host));
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    },
  );

  it("marks redirects on a copy too", () => {
    const res = middleware(request("/dashboard", "binectics.vercel.app"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("does not mark redirects on the canonical host", () => {
    const res = middleware(request("/dashboard", SITE_HOST));
    expect(res.status).toBe(307);
    expect(res.headers.get("x-robots-tag")).toBeNull();
  });
});
