import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanParams, track } from "./track";
import { CONSENT_STORAGE_KEY, CONSENT_VERSION, hasAnalyticsConsent } from "./consent";

const gtag = vi.fn();

function consent(analytics: boolean, version = CONSENT_VERSION) {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ required: true, analytics, version, ts: Date.now() }));
}

describe("analytics", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-TEST123");
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    gtag.mockReset();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sends nothing without consent", () => {
    track("cta_click", { cta: "start_free", page: "/" });
    consent(false);
    track("cta_click", { cta: "start_free", page: "/" });
    expect(gtag).not.toHaveBeenCalled();
  });

  it("ignores consent given for an older version of the banner", () => {
    consent(true, "2.2");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("sends nothing when no analytics tool is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "");
    consent(true);
    track("sign_up_start", { role: "trainer" });
    expect(gtag).not.toHaveBeenCalled();
  });

  it("sends allowed events after consent", () => {
    consent(true);
    track("sign_up_complete", { role: "gym" });
    expect(gtag).toHaveBeenCalledWith("event", "sign_up_complete", { role: "gym" });
  });

  it("drops properties that are not on the allowlist, so health or payment details can't leak", () => {
    const params = { role: "member", weight_kg: "82", fasting: "ramadan", amount: "5000", email: "a@b.co" };
    expect(cleanParams("sign_up_start", params)).toEqual({ role: "member" });
  });

  it("drops free text even in an allowed property", () => {
    expect(cleanParams("cta_click", { cta: "start free! call 0803 123 4567", page: "/" })).toEqual({ page: "/" });
  });
});

describe("analytics sinks and consent hooks", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("passes only consented, cleaned events to a registered sink", async () => {
    const { registerAnalyticsSink } = await import("./track");
    const sink = vi.fn();
    const off = registerAnalyticsSink(sink);
    track("sign_up_start", { role: "trainer", weight_kg: "80" });
    expect(sink).not.toHaveBeenCalled();
    consent(true);
    track("sign_up_start", { role: "trainer", weight_kg: "80" });
    expect(sink).toHaveBeenCalledWith("sign_up_start", { role: "trainer" });
    off();
  });

  it("onAnalyticsConsentChange reports now and on every change", async () => {
    const { onAnalyticsConsentChange, CONSENT_EVENT } = await import("./consent");
    const seen: boolean[] = [];
    const off = onAnalyticsConsentChange((g) => seen.push(g));
    consent(true);
    document.dispatchEvent(new CustomEvent(CONSENT_EVENT));
    consent(false);
    document.dispatchEvent(new CustomEvent(CONSENT_EVENT));
    off();
    expect(seen).toEqual([false, true, false]);
  });
});
