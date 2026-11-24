/**
 * What a provider has typed into onboarding, kept in this browser so a
 * reload does not send them back to step 1 with an empty form. The web twin
 * of the mobile app's onboardingDraft (utils/onboardingDraft.ts): per signed
 * in user and track, an allow-list of plain setup fields only (never a
 * licence number or an uploaded document), dropped after 7 days, on Finish
 * and when the role is changed.
 *
 * The member track keeps its own answers (see _member.tsx), so only the
 * provider tracks are drafted here.
 */
import { ONBOARDING_LICENSE_ID } from "./_credentials";
import { STAFF_INVITED, LISTING_BIO, LISTING_HEADLINE } from "./_providerSetup";

export type DraftTrack = "trainer" | "gym" | "dietitian";

export const ONBOARDING_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PREFIX = "binectics:onboarding-draft:";

export interface OnboardingDraft {
  role: DraftTrack;
  step: number;
  data: Record<string, unknown>;
}

const SHARED = ["city", "country", "countryCode", "currency", "currencyPicked", "payout"];

const FIELDS: Record<DraftTrack, string[]> = {
  gym: [
    ...SHARED,
    "bizName", "entity", "regNumber",
    "locName", "street", "postalCode", "locationId",
    "planTemplate", "planSeeded",
    "staffEmails", "staffRoles", STAFF_INVITED,
  ],
  trainer: [
    ...SHARED,
    "firstName", "lastName", "headline", "specializations", "formats",
    "price1on1", "price1on1Minor", "price1on1Free", "price1on1Later", "duration",
    "priceMonthly", "priceMonthlyMinor",
    LISTING_BIO,
  ],
  dietitian: [
    ...SHARED,
    "fullName", "pronouns", "practiceName",
    // The licence without its number or document: those are identifiers.
    "licName", "licBody", "licCountry", "licExpiry", ONBOARDING_LICENSE_ID,
    "specializations", "populations",
    "sessionDuration", "sessionPrice", "sessionPriceMinor", "sessionFree", "sessionLater",
    LISTING_HEADLINE, LISTING_BIO,
  ],
};

export function isDraftTrack(role: unknown): role is DraftTrack {
  return role === "trainer" || role === "gym" || role === "dietitian";
}

/** Only the fields a track is allowed to keep. */
export function sanitizeDraftData(role: DraftTrack, data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of FIELDS[role]) if (data[k] !== undefined) out[k] = data[k];
  return out;
}

const keyOf = (userId: string) => `${PREFIX}${userId}`;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(userId: string, draft: OnboardingDraft, now = Date.now()): void {
  try {
    storage()?.setItem(
      keyOf(userId),
      JSON.stringify({ savedAt: now, role: draft.role, step: draft.step, data: sanitizeDraftData(draft.role, draft.data) }),
    );
  } catch {
    // Storage blocked or full: onboarding still works, the draft just won't survive.
  }
}

export function loadOnboardingDraft(userId: string, now = Date.now()): OnboardingDraft | null {
  try {
    const s = storage();
    const raw = s?.getItem(keyOf(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: unknown; role?: unknown; step?: unknown; data?: unknown };
    if (
      typeof parsed.savedAt !== "number" ||
      now - parsed.savedAt > ONBOARDING_DRAFT_TTL_MS ||
      !isDraftTrack(parsed.role) ||
      !parsed.data ||
      typeof parsed.data !== "object"
    ) {
      s?.removeItem(keyOf(userId));
      return null;
    }
    const step = typeof parsed.step === "number" && parsed.step >= 1 ? Math.floor(parsed.step) : 1;
    return { role: parsed.role, step, data: sanitizeDraftData(parsed.role, parsed.data as Record<string, unknown>) };
  } catch {
    return null;
  }
}

export function clearOnboardingDraft(userId: string): void {
  try {
    storage()?.removeItem(keyOf(userId));
  } catch {
    // ignore
  }
}

/**
 * Whether a saved draft may be resumed for this account: the track must be
 * the account's own when it already has a provider role (a trainer is never
 * dropped into a stale gym draft), and any track while the role is still
 * open. The step is clamped to the track's length.
 */
export function resumableDraft(
  draft: OnboardingDraft | null,
  established: string | null,
  totalSteps: (role: DraftTrack) => number,
): OnboardingDraft | null {
  if (!draft) return null;
  if (established && established !== draft.role) return null;
  return { ...draft, step: Math.min(Math.max(1, draft.step), totalSteps(draft.role)) };
}
