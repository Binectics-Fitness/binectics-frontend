import { describe, it, expect } from "vitest";
import {
  currencyStepUnanswered,
  trainerCountry,
  trainerLocationPatch,
  trainerSessionPatch,
} from "@/app/onboarding/_config";

describe("trainer onboarding: what each step persists", () => {
  it("treats the untouched country select as its default, so the default is saved too", () => {
    // The select shows "South Africa" without writing data.country.
    expect(trainerCountry({})).toBe("South Africa");
    const { profile } = trainerLocationPatch({ firstName: "Ada" });
    expect(profile).toEqual({ first_name: "Ada", country_code: "ZA" });
  });

  it("saves city and country code from step 1 and the currency chosen there", () => {
    const { profile, currency } = trainerLocationPatch({ city: " Ibadan ", country: "Nigeria", currency: "NGN" });
    expect(profile).toEqual({ city: "Ibadan", country_code: "NG" });
    expect(currency).toBe("NGN");
  });

  it("never derives a currency from the country on its own", () => {
    // Ghana with no selectable cedi: no currency, not USD.
    expect(trainerLocationPatch({ country: "Ghana" }).currency).toBeNull();
    expect(trainerLocationPatch({ country: "United States" }).currency).toBeNull();
  });

  it("will not leave step 1 without a currency", () => {
    expect(currencyStepUnanswered("trainer", 1, { country: "Ghana" })).toBe(true);
    expect(currencyStepUnanswered("trainer", 1, { country: "Ghana", currency: "NGN" })).toBe(false);
    expect(currencyStepUnanswered("trainer", 2, {})).toBe(false);
    expect(currencyStepUnanswered("member", 1, {})).toBe(false);
    expect(currencyStepUnanswered("gym", 1, {})).toBe(true);
    expect(currencyStepUnanswered("dietitian", 1, { currency: "ZAR" })).toBe(false);
  });

  it("turns step 4 into the trainer's own 1:1 session, in the step-1 currency", () => {
    expect(trainerSessionPatch({ country: "Nigeria", currency: "NGN", price1on1Minor: 2500000, duration: "45 min" })).toEqual({
      name: "1:1 session",
      defaultDurationMinutes: 45,
      priceMinor: 2500000,
      currency: "NGN",
    });
  });

  it("creates nothing when no price was entered, and defaults the length to an hour", () => {
    expect(trainerSessionPatch({ country: "Nigeria" })).toBeNull();
    expect(trainerSessionPatch({ country: "Nigeria", price1on1Minor: null })).toBeNull();
    expect(trainerSessionPatch({ currency: "NGN", price1on1Minor: 500000 })?.defaultDurationMinutes).toBe(60);
    // A price with no chosen currency is never saved in a guessed one.
    expect(trainerSessionPatch({ price1on1Minor: 500000 })).toBeNull();
  });

  it("saves Free as a price of 0, and only when Free was chosen", () => {
    expect(trainerSessionPatch({ country: "Nigeria", currency: "NGN", price1on1Free: true })).toEqual({
      name: "1:1 session",
      defaultDurationMinutes: 60,
      priceMinor: 0,
      currency: "NGN",
    });
    // Free wins over a price typed before it was chosen.
    expect(trainerSessionPatch({ currency: "NGN", price1on1Minor: 2500000, price1on1Free: true })?.priceMinor).toBe(0);
    // A typed 0 is not the Free choice; like a blank, it saves nothing.
    expect(trainerSessionPatch({ price1on1Minor: 0 })).toBeNull();
    expect(trainerSessionPatch({ price1on1Minor: 0, price1on1Free: false })).toBeNull();
  });
});
