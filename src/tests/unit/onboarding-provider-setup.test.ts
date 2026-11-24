import { describe, it, expect, vi } from "vitest";
import {
  PLAN_TEMPLATE_SIZES,
  defaultPlanTemplate,
  planTemplateFits,
  staffInviteEmails,
  staffInviteError,
  legalEntityOptions,
  ownerIdHint,
  trainerMonthlyPlan,
  onboardingListing,
  saveOnboardingListing,
  providerDisplayName,
  accountCountryName,
  ONLINE_PLAN_NAME,
} from "@/app/onboarding/_providerSetup";
import { COUNTRY_NAME_TO_CODE } from "@/app/onboarding/_config";
import {
  ONBOARDING_DRAFT_TTL_MS,
  clearOnboardingDraft,
  loadOnboardingDraft,
  resumableDraft,
  sanitizeDraftData,
  saveOnboardingDraft,
} from "@/app/onboarding/_draft";

describe("plan templates against the plan cap", () => {
  it("matches the API's template sizes", () => {
    expect(PLAN_TEMPLATE_SIZES).toEqual({ standard: 3, boutique: 4, crossfit: 2, blank: 0 });
  });

  it("starts on the standard set when it fits, else Start blank", () => {
    expect(defaultPlanTemplate(null)).toBe("standard");
    expect(defaultPlanTemplate(10)).toBe("standard");
    expect(defaultPlanTemplate(2)).toBe("blank");
    expect(planTemplateFits("crossfit", 2)).toBe(true);
    expect(planTemplateFits("boutique", 3)).toBe(false);
    expect(planTemplateFits("blank", 0)).toBe(true);
  });
});

describe("staff invites", () => {
  it("reads one address per line or comma, once each", () => {
    expect(staffInviteEmails({ staffEmails: "a@x.test\nb@x.test, A@x.test\n\n" })).toEqual(["a@x.test", "b@x.test"]);
  });

  it("says the API's reason once, and what to do", () => {
    const why = "The Free plan doesn't include staff members. Upgrade your plan to add them.";
    expect(staffInviteError([])).toBeNull();
    expect(staffInviteError([{ email: "a@x.test", message: why }])).toBe(`We couldn't send a@x.test. ${why} Remove it to continue.`);
    expect(staffInviteError([{ email: "a@x.test", message: why }, { email: "b@x.test", message: why }])).toBe(
      `We couldn't send 2 invites. ${why} Remove them to continue.`,
    );
  });
});

describe("country wording", () => {
  it("has a list per country and a generic one for the rest", () => {
    expect(legalEntityOptions("NG")).toContain("Private limited company (Ltd)");
    expect(legalEntityOptions("NG").join()).not.toMatch(/Pty|CC/);
    expect(legalEntityOptions("ZA")).toContain("Private company (Pty) Ltd");
    expect(legalEntityOptions("FR")).toEqual(legalEntityOptions(undefined));
    expect(ownerIdHint("NG")).not.toMatch(/South Africa/);
    expect(ownerIdHint(undefined)).toBe("Government-issued ID or passport");
  });

  it("names the account's country when the track lists it", () => {
    expect(accountCountryName("ng", COUNTRY_NAME_TO_CODE)).toBe("Nigeria");
    expect(accountCountryName("FR", COUNTRY_NAME_TO_CODE)).toBeNull();
    expect(accountCountryName(undefined, COUNTRY_NAME_TO_CODE)).toBeNull();
  });
});

describe("trainer monthly online price", () => {
  it("becomes a 30-day subscription package in the track's currency", () => {
    expect(trainerMonthlyPlan({ currency: "NGN", priceMonthlyMinor: 4_000_000 })).toEqual({
      name: ONLINE_PLAN_NAME,
      plan_type: "subscription",
      duration_days: 30,
      price_minor: 4_000_000,
      currency: "NGN",
    });
  });

  it("is nothing without a price or a currency", () => {
    expect(trainerMonthlyPlan({ currency: "NGN" })).toBeNull();
    expect(trainerMonthlyPlan({ currency: "NGN", priceMonthlyMinor: 0 })).toBeNull();
    expect(trainerMonthlyPlan({ priceMonthlyMinor: 4_000_000 })).toBeNull();
  });
});

describe("the onboarding listing", () => {
  it("carries the headline, bio, city, country and specialties", () => {
    expect(
      onboardingListing("trainer", { headline: " Strength coach ", bio: "I coach.", city: "Lagos", specializations: ["Strength"] }, "NG"),
    ).toEqual({
      account_type: "personal_trainer",
      headline: "Strength coach",
      bio: "I coach.",
      specialties: ["Strength"],
      city: "Lagos",
      country_code: "NG",
    });
  });

  it("shows a dietitian's specializations by name", () => {
    const listing = onboardingListing("dietitian", { headline: "RD", bio: "Hi.", specializations: ["pcos"] }, undefined);
    expect(listing?.account_type).toBe("dietitian");
    expect(listing?.specialties?.[0]).not.toBe("pcos");
  });

  it("is nothing without both a headline and a bio (the API needs both)", () => {
    expect(onboardingListing("trainer", { headline: "Coach" }, "NG")).toBeNull();
    expect(onboardingListing("trainer", { bio: "Hi" }, "NG")).toBeNull();
  });

  const payload = { account_type: "personal_trainer" as const, headline: "Coach", bio: "Hi." };

  it("creates the listing when there is none", async () => {
    const api = {
      getMyListing: vi.fn(async () => ({ success: false, status: 404, message: "Listing not found" })),
      createMyListing: vi.fn(async () => ({ success: true })),
      updateMyListing: vi.fn(),
    };
    await expect(saveOnboardingListing(payload, api)).resolves.toBeNull();
    expect(api.createMyListing).toHaveBeenCalledWith(payload);
    expect(api.updateMyListing).not.toHaveBeenCalled();
  });

  it("fills the listing that exists, without its account type", async () => {
    const api = {
      getMyListing: vi.fn(async () => ({ success: true, data: { _id: "l-1" } })),
      createMyListing: vi.fn(),
      updateMyListing: vi.fn(async () => ({ success: true })),
    };
    await expect(saveOnboardingListing(payload, api)).resolves.toBeNull();
    expect(api.updateMyListing).toHaveBeenCalledWith({ headline: "Coach", bio: "Hi." });
    expect(api.createMyListing).not.toHaveBeenCalled();
  });

  it("passes on a refusal, and never creates when the read failed for another reason", async () => {
    const refused = {
      getMyListing: vi.fn(async () => ({ success: false, status: 404 })),
      createMyListing: vi.fn(async () => ({ success: false, message: "Headline is required" })),
      updateMyListing: vi.fn(),
    };
    await expect(saveOnboardingListing(payload, refused)).resolves.toBe("Headline is required");
    const down = {
      getMyListing: vi.fn(async () => ({ success: false, status: 500 })),
      createMyListing: vi.fn(),
      updateMyListing: vi.fn(),
    };
    await expect(saveOnboardingListing(payload, down)).resolves.toBe("We couldn't load your profile. Try again.");
    expect(down.createMyListing).not.toHaveBeenCalled();
  });

  it("names the provider from what was typed, else the account", () => {
    const user = { first_name: "Chinedu", last_name: "Eze" };
    expect(providerDisplayName("trainer", {}, user)).toBe("Chinedu Eze");
    expect(providerDisplayName("trainer", { firstName: "Chi" }, user)).toBe("Chi");
    expect(providerDisplayName("dietitian", { fullName: "Halima Bello, RD" }, user)).toBe("Halima Bello, RD");
    expect(providerDisplayName("dietitian", {}, user)).toBe("Chinedu Eze");
    expect(providerDisplayName("trainer", {}, null)).toBe("");
  });
});

describe("onboarding draft", () => {
  it("keeps only plain setup fields: no licence number, no documents, no prompts", () => {
    const kept = sanitizeDraftData("dietitian", {
      fullName: "Halima",
      licName: "RD",
      licNumber: "SECRET-1",
      doc_license: "https://res.cloudinary.com/x.pdf",
      sessionMissing: true,
    });
    expect(kept).toEqual({ fullName: "Halima", licName: "RD" });
    expect(sanitizeDraftData("gym", { bizName: "Imole", doc_id: "https://x", planSeeded: true })).toEqual({ bizName: "Imole", planSeeded: true });
  });

  it("round-trips per user and expires after 7 days", () => {
    localStorage.clear();
    saveOnboardingDraft("u-1", { role: "gym", step: 3, data: { bizName: "Imole" } }, 1_000);
    expect(loadOnboardingDraft("u-2", 1_000)).toBeNull();
    expect(loadOnboardingDraft("u-1", 2_000)).toEqual({ role: "gym", step: 3, data: { bizName: "Imole" } });
    expect(loadOnboardingDraft("u-1", 1_000 + ONBOARDING_DRAFT_TTL_MS + 1)).toBeNull();
    // Expired drafts are removed.
    expect(localStorage.length).toBe(0);
    saveOnboardingDraft("u-1", { role: "gym", step: 3, data: {} });
    clearOnboardingDraft("u-1");
    expect(loadOnboardingDraft("u-1")).toBeNull();
  });

  it("resumes only the account's own track, on a step the track has", () => {
    const draft = { role: "gym" as const, step: 12, data: {} };
    const steps = () => 8;
    expect(resumableDraft(draft, null, steps)).toEqual({ ...draft, step: 8 });
    expect(resumableDraft(draft, "gym", steps)?.step).toBe(8);
    expect(resumableDraft(draft, "trainer", steps)).toBeNull();
    expect(resumableDraft(null, null, steps)).toBeNull();
  });
});
