import { COUNTRY_NAME_TO_CODE, dietitianCountry } from "./_config";
import {
  isBlankLicense,
  licenseDraftError,
  licenseDraftFrom,
  licenseInputFrom,
  MAX_PRONOUNS,
  MAX_SPECIALIZATIONS,
  type LicenseDraft,
  type LicenseInput,
  type LicenseView,
  type UpdateCredentialsRequest,
} from "@/lib/credentials/dietitian";

/**
 * What the dietitian track saves to /credentials/me. Kept apart from
 * _config.ts so the track's rules for workspaces, prices and currencies
 * and these can change without touching each other.
 */

/** The licence step 2 collects, as a form draft; its country defaults to step 1's. */
export function dietitianLicenseDraft(data: Record<string, unknown>): LicenseDraft {
  return {
    name: (data.licName as string) || "",
    issuingBody: (data.licBody as string) || "",
    number: (data.licNumber as string) || "",
    countryCode: (data.licCountry as string) || COUNTRY_NAME_TO_CODE[dietitianCountry(data)] || "",
    expiresAt: (data.licExpiry as string) || "",
    newDocumentUrl: (data.doc_license as string) || undefined,
  };
}

/**
 * What a dietitian step saves: pronouns on step 1, the licence on step 2,
 * specializations and populations on step 3. `error` keeps the person on
 * the step: a half-filled licence can't be saved, and leaving it blank is
 * fine (it can be added from the profile later). Step 2's `licenses` holds
 * only the onboarding licence; the page merges it into what is on file
 * (withOnboardingLicense) so licences added elsewhere are never dropped.
 */
export function dietitianCredentialsPatch(
  step: number,
  data: Record<string, unknown>,
): { body: UpdateCredentialsRequest | null; error: string | null } {
  if (step === 1) {
    const pronouns = ((data.pronouns as string) || "").trim();
    return { body: pronouns ? { pronouns: pronouns.slice(0, MAX_PRONOUNS) } : null, error: null };
  }
  if (step === 2) {
    const draft = dietitianLicenseDraft(data);
    if (isBlankLicense(draft)) return { body: null, error: null };
    const error = licenseDraftError(draft);
    if (error) return { body: null, error: `${error} Or clear the licence to add it later.` };
    return { body: { licenses: [licenseInputFrom(draft)] }, error: null };
  }
  if (step === 3) {
    return {
      body: {
        specializations: ((data.specializations as string[]) || []).slice(0, MAX_SPECIALIZATIONS),
        populations: (data.populations as string[]) || [],
      },
      error: null,
    };
  }
  return { body: null, error: null };
}

/** Where the page keeps the id of the licence onboarding saved, for Back + Continue. */
export const ONBOARDING_LICENSE_ID = "licId";

/**
 * The full licence list to send for step 2. PATCH replaces the list, so
 * sending only the onboarding licence would drop any licence already on
 * file (added from the profile, another device, an earlier run). Every
 * licence on file is kept as it is (by id, its document untouched); the
 * onboarding one replaces the licence it saved before (`ownId`), or is
 * added.
 */
export function withOnboardingLicense(
  onFile: LicenseView[],
  license: LicenseInput,
  ownId: string | undefined,
): LicenseInput[] {
  const kept = onFile
    .filter((l) => l._id !== ownId)
    .map((l) => licenseInputFrom(licenseDraftFrom(l)));
  const mine = ownId && onFile.some((l) => l._id === ownId) ? { ...license, _id: ownId } : license;
  return [...kept, mine];
}

/** The id the API gave the onboarding licence: the one not on file before. */
export function onboardingLicenseId(
  before: LicenseView[],
  after: LicenseView[],
  ownId: string | undefined,
): string | undefined {
  if (ownId && after.some((l) => l._id === ownId)) return ownId;
  const known = new Set(before.map((l) => l._id));
  return after.find((l) => !known.has(l._id))?._id;
}
