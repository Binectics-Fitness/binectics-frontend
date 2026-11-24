import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * A provider track starts on the person's country, never on one fixed
 * country: the account's own, else the region detected from the visit, and
 * nothing when the API could only fall back to its default.
 */

const h = vi.hoisted(() => ({
  user: null as null | { country_code?: string },
  region: null as null | { country: string; isDetected: boolean; isFallback: boolean },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: h.user }) }));
vi.mock("@/contexts/RegionContext", () => ({ useOptionalRegion: () => h.region }));

import { useHomeCountry } from "@/app/onboarding/_homeCountry";

beforeEach(() => {
  h.user = null;
  h.region = null;
});

describe("useHomeCountry", () => {
  it("prefers the account's country", () => {
    h.user = { country_code: "ng" };
    h.region = { country: "KE", isDetected: true, isFallback: false };
    expect(renderHook(() => useHomeCountry()).result.current).toBe("NG");
  });

  it("uses the detected region when the account has none", () => {
    h.user = {};
    h.region = { country: "NG", isDetected: true, isFallback: false };
    expect(renderHook(() => useHomeCountry()).result.current).toBe("NG");
  });

  it("is nothing while detecting, on the API's fallback, or outside a region provider", () => {
    h.region = { country: "US", isDetected: false, isFallback: false };
    expect(renderHook(() => useHomeCountry()).result.current).toBeUndefined();
    h.region = { country: "US", isDetected: true, isFallback: true };
    expect(renderHook(() => useHomeCountry()).result.current).toBeUndefined();
    h.region = null;
    expect(renderHook(() => useHomeCountry()).result.current).toBeUndefined();
  });
});
