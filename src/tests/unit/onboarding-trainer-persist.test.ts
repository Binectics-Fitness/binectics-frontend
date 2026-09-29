import { describe, it, expect } from "vitest";
import {
  trainerCountry,
  trainerLocationPatch,
  trainerSessionPatch,
} from "@/app/onboarding/_config";

describe("trainer onboarding: what each step persists", () => {
  it("treats the untouched country select as its default, so the default is saved too", () => {
    // The select shows "South Africa" without writing data.country.
    expect(trainerCountry({})).toBe("South Africa");
    const { profile, currency } = trainerLocationPatch({ firstName: "Ada" });
    expect(profile).toEqual({ first_name: "Ada", country_code: "ZA" });
    expect(currency).toBe("ZAR");
  });

  it("saves city and country code from step 1 and prices the workspace in that country's currency", () => {
    const { profile, currency } = trainerLocationPatch({ city: " Ibadan ", country: "Nigeria" });
    expect(profile).toEqual({ city: "Ibadan", country_code: "NG" });
    expect(currency).toBe("NGN");
  });

  it("turns step 4 into the trainer's own 1:1 session, in the step-1 currency", () => {
    expect(trainerSessionPatch({ country: "Nigeria", price1on1Minor: 2500000, duration: "45 min" })).toEqual({
      name: "1:1 session",
      defaultDurationMinutes: 45,
      priceMinor: 2500000,
      currency: "NGN",
    });
  });

  it("creates nothing when no price was entered, and defaults the length to an hour", () => {
    expect(trainerSessionPatch({ country: "Nigeria" })).toBeNull();
    expect(trainerSessionPatch({ country: "Nigeria", price1on1Minor: null })).toBeNull();
    expect(trainerSessionPatch({ price1on1Minor: 500000 })?.defaultDurationMinutes).toBe(60);
  });

  it("saves Free as a price of 0, and only when Free was chosen", () => {
    expect(trainerSessionPatch({ country: "Nigeria", price1on1Free: true })).toEqual({
      name: "1:1 session",
      defaultDurationMinutes: 60,
      priceMinor: 0,
      currency: "NGN",
    });
    // Free wins over a price typed before it was chosen.
    expect(trainerSessionPatch({ price1on1Minor: 2500000, price1on1Free: true })?.priceMinor).toBe(0);
    // A typed 0 is not the Free choice; like a blank, it saves nothing.
    expect(trainerSessionPatch({ price1on1Minor: 0 })).toBeNull();
    expect(trainerSessionPatch({ price1on1Minor: 0, price1on1Free: false })).toBeNull();
  });
});
