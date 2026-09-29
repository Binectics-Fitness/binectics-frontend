import { describe, it, expect, vi } from "vitest";
import {
  dietitianCountry,
  dietitianCurrency,
  dietitianLocationPatch,
  dietitianSessionPatch,
  sessionPriceMinor,
  upsertOwnSession,
  ROLES,
  type OwnSessionApi,
} from "@/app/onboarding/_config";

describe("dietitian onboarding: what each step persists", () => {
  it("treats the untouched country select as its default, so the default is saved too", () => {
    // The step 1 select shows "Nigeria" without writing data.country.
    expect(dietitianCountry({})).toBe("Nigeria");
    const { profile, currency } = dietitianLocationPatch({ fullName: "Dr Nadia Hassan" });
    expect(profile).toEqual({ first_name: "Nadia", last_name: "Hassan", country_code: "NG" });
    expect(currency).toBe("NGN");
  });

  it("saves city and country code from step 1 and prices the workspace in that country's currency", () => {
    const { profile, currency } = dietitianLocationPatch({ fullName: "Thandi", city: " Cape Town ", country: "South Africa" });
    expect(profile).toEqual({ first_name: "Thandi", city: "Cape Town", country_code: "ZA" });
    expect(currency).toBe("ZAR");
    expect(dietitianCurrency({ country: "United Kingdom" })).toBe("GBP");
  });

  it("turns a price into the dietitian's own session, in the step 1 currency", () => {
    expect(
      dietitianSessionPatch({ country: "Kenya", sessionPriceMinor: 350000, sessionDuration: "45 min" }),
    ).toEqual({
      name: "1:1 session",
      defaultDurationMinutes: 45,
      priceMinor: 350000,
      currency: "KES",
    });
  });

  it("saves Free as a price of 0, over any price typed before it", () => {
    expect(dietitianSessionPatch({ sessionFree: true })).toEqual({
      name: "1:1 session",
      defaultDurationMinutes: 60,
      priceMinor: 0,
      currency: "NGN",
    });
    expect(dietitianSessionPatch({ sessionFree: true, sessionPriceMinor: 900000 })?.priceMinor).toBe(0);
  });

  it("creates nothing when neither a price nor Free was given: set up later is not free", () => {
    expect(dietitianSessionPatch({})).toBeNull();
    expect(dietitianSessionPatch({ sessionPriceMinor: null, sessionDuration: "30 min" })).toBeNull();
    expect(dietitianSessionPatch({ sessionPriceMinor: 0 })).toBeNull();
    expect(dietitianSessionPatch({ sessionPriceMinor: 0, sessionFree: false })).toBeNull();
  });

  it("puts the consultation step right before the payout step", () => {
    const titles = ROLES.find((r) => r.id === "dietitian")!.steps.map((s) => s.title);
    expect(titles).toEqual([
      "Your practice basics",
      "Licensure",
      "Your specializations",
      "Seed your library",
      "Set your consultation",
      "Connect your payout",
      "Preview & publish",
    ]);
  });
});

describe("sessionPriceMinor", () => {
  it("keeps only whole, positive minor amounts, and 0 only for Free", () => {
    expect(sessionPriceMinor(1500, false)).toBe(1500);
    expect(sessionPriceMinor(undefined, true)).toBe(0);
    expect(sessionPriceMinor(undefined, false)).toBeNull();
    expect(sessionPriceMinor(-100, false)).toBeNull();
    expect(sessionPriceMinor(12.5, false)).toBeNull();
    expect(sessionPriceMinor("1500", false)).toBeNull();
  });
});

describe("upsertOwnSession", () => {
  const session = { name: "1:1 session", defaultDurationMinutes: 60, priceMinor: 0, currency: "NGN" as const };

  function fakeApi(existing: { id: string; name: string }[]) {
    return {
      getOwnTypes: vi.fn(async () => ({ data: existing })),
      createOwnType: vi.fn(async () => ({})),
      updateOwnType: vi.fn(async () => ({})),
    } satisfies OwnSessionApi;
  }

  it("creates the session when the provider has none of that name", async () => {
    const api = fakeApi([{ id: "a", name: "Follow-up" }]);
    await upsertOwnSession(session, api);
    expect(api.createOwnType).toHaveBeenCalledWith(session);
    expect(api.updateOwnType).not.toHaveBeenCalled();
  });

  it("updates and reactivates the one with the same name, ignoring case", async () => {
    const api = fakeApi([{ id: "b", name: "1:1 Session" }]);
    await upsertOwnSession({ ...session, priceMinor: 500000 }, api);
    expect(api.updateOwnType).toHaveBeenCalledWith("b", {
      defaultDurationMinutes: 60,
      priceMinor: 500000,
      currency: "NGN",
      isActive: true,
    });
    expect(api.createOwnType).not.toHaveBeenCalled();
  });
});
