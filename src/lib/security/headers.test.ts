import { describe, expect, it } from "vitest";
import { enforcedCsp, reportOnlyCsp, securityHeaders } from "./headers";

const byKey = () => Object.fromEntries(securityHeaders().map((h) => [h.key, h.value]));

describe("security headers", () => {
  it("forces HTTPS for a year without preloading", () => {
    const hsts = byKey()["Strict-Transport-Security"];
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).not.toContain("preload");
  });

  it("keeps nosniff, the referrer policy and the frame guard", () => {
    const h = byKey();
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["X-Frame-Options"]).toBe("SAMEORIGIN");
  });

  it("enforces only directives that cannot block a resource load", () => {
    const csp = enforcedCsp();
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    for (const fetchDirective of ["default-src", "script-src", "connect-src", "frame-src", "img-src"]) {
      expect(csp).not.toContain(fetchDirective);
    }
  });

  it("lets Paystack checkout run under the report-only allowlist", () => {
    const csp = reportOnlyCsp();
    expect(csp).toMatch(/frame-src [^;]*https:\/\/checkout\.paystack\.com/);
    expect(csp).toMatch(/script-src [^;]*https:\/\/js\.paystack\.co/);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/api\.paystack\.co/);
  });

  it("lets PostHog send events and load its scripts under the allowlist", () => {
    const csp = reportOnlyCsp();
    expect(csp).toMatch(/connect-src [^;]*https:\/\/eu\.i\.posthog\.com/);
    expect(csp).toMatch(/script-src [^;]*https:\/\/eu-assets\.i\.posthog\.com/);
  });

  it("keeps the API same-origin: no Azure host in connect-src", () => {
    expect(reportOnlyCsp()).toMatch(/connect-src 'self'/);
    expect(reportOnlyCsp()).not.toContain("azurewebsites.net");
  });
});
