import { describe, it, expect } from "vitest";
import {
  DIETITIAN_SPECIALIZATIONS,
  emptyLicenseDraft,
  isBlankLicense,
  licenseBadgeSummary,
  licenseDraftError,
  licenseDraftFrom,
  licenseInputFrom,
  specializationCode,
  specializationLabel,
  toggleCode,
} from "@/lib/credentials/dietitian";
import { dietitianCredentialsPatch, dietitianLicenseDraft, onboardingLicenseId, withOnboardingLicense } from "@/app/onboarding/_credentials";

describe("dietitian credentials: the vocabularies", () => {
  it("keeps the onboarding chip labels and maps them to the API codes", () => {
    expect(DIETITIAN_SPECIALIZATIONS.map((s) => s.label)).toEqual([
      "PCOS", "Diabetes", "Sport performance", "Gestational", "IBS · FODMAP", "Pre/post-natal",
      "Weight management", "Cardiovascular", "Renal", "Paediatric", "Eating disorders",
    ]);
    expect(specializationCode("IBS · FODMAP")).toBe("ibs_fodmap");
    expect(specializationLabel("ibs_fodmap")).toBe("IBS · FODMAP");
    // An unknown code (a newer API) shows as itself rather than vanishing.
    expect(specializationLabel("new_thing")).toBe("new_thing");
  });

  it("toggles codes and stops at the cap", () => {
    expect(toggleCode(["pcos"], "pcos")).toEqual([]);
    expect(toggleCode(["a", "b"], "c", 2)).toEqual(["a", "b"]);
    expect(toggleCode(["a"], "c", 2)).toEqual(["a", "c"]);
  });
});

describe("licence drafts", () => {
  const filled = {
    ...emptyLicenseDraft("NG"),
    name: " Registered Dietitian ",
    issuingBody: "DAN",
    expiresAt: "2027-12-31",
  };

  it("says what is missing", () => {
    expect(licenseDraftError(emptyLicenseDraft())).toBe(
      "Add the licence name, who issued it, the country and the expiry date.",
    );
    expect(licenseDraftError({ ...filled, expiresAt: "" })).toBe("Add the expiry date.");
    expect(licenseDraftError(filled)).toBeNull();
  });

  it("sends a fresh upload, keeps an existing document by leaving it out, and removes on request", () => {
    expect(licenseInputFrom(filled)).toEqual({
      name: "Registered Dietitian",
      issuing_body: "DAN",
      country_code: "NG",
      expires_at: "2027-12-31",
    });
    expect(licenseInputFrom({ ...filled, newDocumentUrl: "ref" }).document_url).toBe("ref");
    const kept = licenseDraftFrom({
      _id: "l1", name: "RD", issuing_body: "DAN", number: "N-1", country_code: "NG",
      expires_at: "2027-12-31T00:00:00.000Z", is_current: true, has_document: true,
      document_url: "https://signed.example/x",
    });
    // The signed link is never sent back.
    expect(licenseInputFrom(kept)).toEqual({
      _id: "l1", name: "RD", issuing_body: "DAN", number: "N-1", country_code: "NG", expires_at: "2027-12-31",
    });
    expect(licenseInputFrom({ ...kept, removeDocument: true }).document_url).toBeNull();
  });

  it("summarises the public badges", () => {
    expect(licenseBadgeSummary([{ issuing_body: "DAN", country_code: "NG" }, { issuing_body: "CDR", country_code: "" }])).toBe("DAN (NG), CDR");
    expect(licenseBadgeSummary(undefined)).toBe("");
  });
});

describe("dietitian onboarding: what steps 1 to 3 save to the credentials", () => {
  it("step 1 saves the pronouns, and nothing when blank", () => {
    expect(dietitianCredentialsPatch(1, { pronouns: " she/her " })).toEqual({ body: { pronouns: "she/her" }, error: null });
    expect(dietitianCredentialsPatch(1, {})).toEqual({ body: null, error: null });
  });

  it("step 2 saves a complete licence, in step 1's country unless changed", () => {
    const data = { country: "Kenya", licName: "RD", licBody: "KNDI", licExpiry: "2027-06-30", doc_license: "ref-url" };
    expect(dietitianLicenseDraft(data).countryCode).toBe("KE");
    expect(dietitianCredentialsPatch(2, data)).toEqual({
      body: {
        licenses: [{ name: "RD", issuing_body: "KNDI", country_code: "KE", expires_at: "2027-06-30", document_url: "ref-url" }],
      },
      error: null,
    });
  });

  it("step 2 moves on when left blank, and holds a half-filled licence", () => {
    expect(isBlankLicense(dietitianLicenseDraft({}))).toBe(true);
    expect(dietitianCredentialsPatch(2, {})).toEqual({ body: null, error: null });
    const half = dietitianCredentialsPatch(2, { licName: "RD" });
    expect(half.body).toBeNull();
    expect(half.error).toMatch(/^Add who issued it and the expiry date\. Or clear the licence/);
  });

  it("step 3 saves the codes, at most five specializations", () => {
    expect(
      dietitianCredentialsPatch(3, { specializations: ["pcos", "renal", "diabetes", "gestational", "paediatric", "cardiovascular"], populations: ["adults"] }),
    ).toEqual({
      body: { specializations: ["pcos", "renal", "diabetes", "gestational", "paediatric"], populations: ["adults"] },
      error: null,
    });
    // An empty answer is saved too, so clearing the chips sticks.
    expect(dietitianCredentialsPatch(3, {}).body).toEqual({ specializations: [], populations: [] });
  });

  it("other steps save no credentials", () => {
    expect(dietitianCredentialsPatch(5, { pronouns: "x" })).toEqual({ body: null, error: null });
  });
});

describe("onboarding step 2 never wipes licences on file", () => {
  const onFile = (id: string, body = "DAN") => ({
    _id: id, name: "RD", issuing_body: body, number: null, country_code: "NG",
    expires_at: "2027-01-31T00:00:00.000Z", is_current: true, has_document: true, document_url: "https://signed/x",
  });
  const draft = { name: "RD", issuing_body: "KNDI", country_code: "KE", expires_at: "2028-01-01" };

  it("keeps every licence on file, by id with its document, and adds the onboarding one", () => {
    expect(withOnboardingLicense([onFile("a")], draft, undefined)).toEqual([
      { _id: "a", name: "RD", issuing_body: "DAN", country_code: "NG", expires_at: "2027-01-31" },
      draft,
    ]);
  });

  it("on Back + Continue, edits the licence onboarding saved instead of adding another", () => {
    expect(withOnboardingLicense([onFile("a"), onFile("mine", "OLD")], draft, "mine")).toEqual([
      { _id: "a", name: "RD", issuing_body: "DAN", country_code: "NG", expires_at: "2027-01-31" },
      { ...draft, _id: "mine" },
    ]);
    // Removed from the profile meanwhile: added again rather than refused.
    expect(withOnboardingLicense([onFile("a")], draft, "gone")).toEqual([
      expect.objectContaining({ _id: "a" }),
      draft,
    ]);
  });

  it("finds the id the API gave the onboarding licence", () => {
    expect(onboardingLicenseId([onFile("a")], [onFile("a"), onFile("new")], undefined)).toBe("new");
    expect(onboardingLicenseId([onFile("a"), onFile("mine")], [onFile("a"), onFile("mine")], "mine")).toBe("mine");
  });
});
