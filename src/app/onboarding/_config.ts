import { UserRole } from "@/lib/types";
import type { CurrencyCode } from "@/lib/constants/regions";
export type RoleId = "member" | "trainer" | "gym" | "dietitian";

export const VALID_ROLES: RoleId[] = ["member", "trainer", "gym", "dietitian"];

/** The country choices the provider tracks offer, as ISO 3166-1 alpha-2. */
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "South Africa": "ZA",
  Nigeria: "NG",
  Kenya: "KE",
  Ghana: "GH",
  "United States": "US",
  "United Kingdom": "GB",
};

/** Suggested default currency for the onboarding country choices. */
export const COUNTRY_NAME_TO_CURRENCY: Record<string, CurrencyCode> = {
  "South Africa": "ZAR",
  Nigeria: "NGN",
  Kenya: "KES",
  Ghana: "USD", // GHS not supported yet
  "United States": "USD",
  "United Kingdom": "GBP",
};

/** Maps the account's server-side role to the onboarding RoleId, or null
 *  if the account has no resolvable role yet (or an unrecognized one). */
export const ACCOUNT_ROLE_TO_ID: Record<string, RoleId> = {
  USER: "member",
  TRAINER: "trainer",
  GYM_OWNER: "gym",
  DIETITIAN: "dietitian",
};

/**
 * Resolves the account's *established* role — one that reflects an actual
 * commitment (a provider CTA signup, or a promotion from a completed track).
 *
 * `USER`/member deliberately does NOT count: the backend assigns
 * `fitness_member` to every generic signup as a default, so on its own it
 * proves nothing about intent. Treating that default as established was the
 * bug that locked every generic signup out of the role picker. Members whose
 * role really was preassigned (the member invite / gym enrollment flow) are
 * detected separately, via membership evidence — see the onboarding page.
 */
/** The default the step 1 select shows when the trainer never touches it. */
export const TRAINER_DEFAULT_COUNTRY = "South Africa";

/**
 * The country a trainer chose on step 1, or the select's default. The
 * select only writes `data.country` on change, so a trainer who keeps the
 * default has nothing in the data; reading the raw value there saved no
 * country and no workspace currency while step 4 priced in the default's
 * currency anyway.
 */
export function trainerCountry(data: Record<string, unknown>): string {
  return (data.country as string) || TRAINER_DEFAULT_COUNTRY;
}

/** What step 1 of the trainer track persists to the profile and the workspace. */
export function trainerLocationPatch(data: Record<string, unknown>): {
  profile: { first_name?: string; last_name?: string; city?: string; country_code?: string };
  currency: CurrencyCode;
} {
  const profile: { first_name?: string; last_name?: string; city?: string; country_code?: string } = {};
  if (data.firstName) profile.first_name = data.firstName as string;
  if (data.lastName) profile.last_name = data.lastName as string;
  const city = (data.city as string | undefined)?.trim();
  if (city) profile.city = city;
  const country = trainerCountry(data);
  const code = COUNTRY_NAME_TO_CODE[country];
  if (code) profile.country_code = code;
  return { profile, currency: COUNTRY_NAME_TO_CURRENCY[country] ?? "USD" };
}

/**
 * The price a session step answered, in minor units: 0 when Free was chosen,
 * the typed amount when it is above zero, and null for no answer. Mirrors the
 * mobile app: a blank price is not free, it means "set it up later" and
 * creates no session; and a typed 0 is not free either (free is an explicit
 * choice), so it also creates nothing.
 */
export function sessionPriceMinor(minor: unknown, free: unknown): number | null {
  if (free === true) return 0;
  if (typeof minor !== "number" || !Number.isInteger(minor) || minor <= 0) return null;
  return minor;
}

/** "45 min" (what the length select holds) as minutes, or the fallback. */
function sessionMinutes(value: unknown, fallback = 60): number {
  return parseInt(String(value ?? fallback), 10) || fallback;
}

/**
 * The step of each provider track that sets the session members book, and
 * the data keys it answers in. The answer is a price, Free, or an explicit
 * "Set up later"; Continue waits for one of the three, so no provider leaves
 * the step with nothing bookable without having chosen that.
 */
export const SESSION_FIELDS = {
  trainer: { step: 4, minor: "price1on1Minor", free: "price1on1Free", later: "price1on1Later" },
  dietitian: { step: 5, minor: "sessionPriceMinor", free: "sessionFree", later: "sessionLater" },
} as const;

/** Set when Continue was pressed on an unanswered session step. */
export const SESSION_MISSING = "sessionMissing";

/** True on a provider's session step while it has no answer yet. */
export function sessionStepUnanswered(role: RoleId | null, step: number, data: Record<string, unknown>): boolean {
  if (role !== "trainer" && role !== "dietitian") return false;
  const f = SESSION_FIELDS[role];
  if (step !== f.step || data[f.later] === true) return false;
  return sessionPriceMinor(data[f.minor], data[f.free]) === null;
}

export interface OwnSessionPatch {
  name: string;
  defaultDurationMinutes: number;
  priceMinor: number;
  currency: CurrencyCode;
}

/**
 * The trainer's own "1:1 session" as step 4 describes it: a price, or 0 when
 * Free was chosen. Null when neither was given; a blank price is not a free
 * session, it is no answer, and the trainer sets it up later.
 */
export function trainerSessionPatch(data: Record<string, unknown>): OwnSessionPatch | null {
  if (data[SESSION_FIELDS.trainer.later] === true) return null;
  const priceMinor = sessionPriceMinor(data.price1on1Minor, data.price1on1Free);
  if (priceMinor === null) return null;
  return {
    name: "1:1 session",
    defaultDurationMinutes: sessionMinutes(data.duration),
    priceMinor,
    currency: COUNTRY_NAME_TO_CURRENCY[trainerCountry(data)] ?? "USD",
  };
}

/** The default the dietitian step 1 country select shows when untouched. */
export const DIETITIAN_DEFAULT_COUNTRY = "Nigeria";

/**
 * The name of the session a dietitian's onboarding creates. The settings
 * editor (ConsultationAvailabilityManager) creates a provider's first own
 * session under this same name for trainers and dietitians alike, and edits
 * whichever own session is active, so the two stay one session.
 */
export const DIETITIAN_SESSION_NAME = "1:1 session";

/** The country a dietitian chose on step 1, or the select's default. */
export function dietitianCountry(data: Record<string, unknown>): string {
  return (data.country as string) || DIETITIAN_DEFAULT_COUNTRY;
}

/** The currency a dietitian's workspace and consultation price are in. */
export function dietitianCurrency(data: Record<string, unknown>): CurrencyCode {
  return COUNTRY_NAME_TO_CURRENCY[dietitianCountry(data)] ?? "USD";
}

/**
 * What step 1 of the dietitian track persists to the profile and the
 * workspace: the name (a leading "Dr" or "Prof" dropped), city, and the
 * country's code, with the workspace priced in that country's currency, as
 * trainerLocationPatch does for trainers.
 */
export function dietitianLocationPatch(data: Record<string, unknown>): {
  profile: { first_name?: string; last_name?: string; city?: string; country_code?: string };
  currency: CurrencyCode;
} {
  const profile: { first_name?: string; last_name?: string; city?: string; country_code?: string } = {};
  const fullName = ((data.fullName as string) || "").replace(/^(Dr\.?|Prof\.?)\s*/i, "").trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    profile.first_name = parts.slice(0, -1).join(" ");
    profile.last_name = parts[parts.length - 1];
  } else if (parts.length === 1) {
    profile.first_name = parts[0];
  }
  const city = (data.city as string | undefined)?.trim();
  if (city) profile.city = city;
  const code = COUNTRY_NAME_TO_CODE[dietitianCountry(data)];
  if (code) profile.country_code = code;
  return { profile, currency: dietitianCurrency(data) };
}

/**
 * The dietitian's own consultation as the session step describes it: a
 * price, or 0 when Free was chosen. Null when neither was given, which
 * creates no session ("set it up later"), a different state from free.
 */
export function dietitianSessionPatch(data: Record<string, unknown>): OwnSessionPatch | null {
  if (data[SESSION_FIELDS.dietitian.later] === true) return null;
  const priceMinor = sessionPriceMinor(data.sessionPriceMinor, data.sessionFree);
  if (priceMinor === null) return null;
  return {
    name: DIETITIAN_SESSION_NAME,
    defaultDurationMinutes: sessionMinutes(data.sessionDuration),
    priceMinor,
    currency: dietitianCurrency(data),
  };
}

/** The slice of consultationsService that saving an own session needs. */
export interface OwnSessionApi {
  getOwnTypes(): Promise<{ success: boolean; data?: { id: string; name: string }[] | null }>;
  createOwnType(payload: OwnSessionPatch): Promise<{ success: boolean }>;
  updateOwnType(
    id: string,
    payload: Omit<OwnSessionPatch, "name"> & { isActive: boolean },
  ): Promise<{ success: boolean }>;
}

/**
 * Saves an onboarding session and says whether it was saved. The provider's
 * own session with the same name (case-insensitive, archived ones included)
 * is updated and brought back, otherwise one is created, so going back and
 * changing the price updates the session instead of colliding with it.
 *
 * The API client resolves failures rather than throwing, so a failed list is
 * not an empty one: creating then would hit the existing session and leave
 * the old price in place with nothing said. It stops there instead.
 */
export async function upsertOwnSession(session: OwnSessionPatch, api: OwnSessionApi): Promise<boolean> {
  try {
    const own = await api.getOwnTypes();
    if (!own.success) return false;
    const existing = (own.data ?? []).find((t) => t.name.toLowerCase() === session.name.toLowerCase());
    const saved = existing
      ? await api.updateOwnType(existing.id, {
          defaultDurationMinutes: session.defaultDurationMinutes,
          priceMinor: session.priceMinor,
          currency: session.currency,
          isActive: true,
        })
      : await api.createOwnType(session);
    return saved.success;
  } catch {
    return false;
  }
}

export function resolveEstablishedRole(
  accountUserRole: string | null | undefined,
): RoleId | null {
  const fromAccount =
    (accountUserRole && ACCOUNT_ROLE_TO_ID[accountUserRole]) || null;
  return fromAccount && fromAccount !== "member" ? fromAccount : null;
}

/** What the API calls an account (organization.account_type) → what the app calls its role. */
export const ACCOUNT_TYPE_TO_USER_ROLE: Record<string, UserRole> = {
  fitness_member: UserRole.USER,
  personal_trainer: UserRole.TRAINER,
  gym_owner: UserRole.GYM_OWNER,
  dietitian: UserRole.DIETITIAN,
};

export type WorkspaceDecision =
  | { kind: "member" }
  | { kind: "reuse"; orgId: string }
  | { kind: "create" }
  | { kind: "blocked"; reason: "loading" | "gate" | "foreign" };

/**
 * What Continue should do about the workspace before any request is made.
 * Kept pure so the cases can be pinned: the member track needs none; a
 * workspace the person owns is reused; one they merely belong to (invited
 * staff) is never written to under a provider track; nothing is created
 * while the account or the org list is still loading; and a member-role
 * account creates one only once membership evidence has cleared it as a
 * free signup.
 */
export function workspaceDecision(input: {
  currentOrg: { _id: string; owner_id: string } | null;
  userId: string | undefined;
  providerTrack: boolean;
  accountRole: RoleId | null;
  memberGate: "pending" | "invited" | "free";
  orgLoading: boolean;
}): WorkspaceDecision {
  if (!input.providerTrack) return { kind: "member" };
  if (input.orgLoading) return { kind: "blocked", reason: "loading" };
  if (input.currentOrg) {
    return input.currentOrg.owner_id === input.userId
      ? { kind: "reuse", orgId: input.currentOrg._id }
      : { kind: "blocked", reason: "foreign" };
  }
  if (input.accountRole === "member" && input.memberGate !== "free") {
    return { kind: "blocked", reason: "gate" };
  }
  return { kind: "create" };
}

/**
 * Whether the locked rail may offer "Change role": the account's provider
 * role came from a workspace it owns, and onboarding isn't finished. The API
 * decides whether that workspace is still untouched; this only decides
 * whether to ask.
 */
export function canChangeRole(
  user:
    | { id: string; role: string; is_onboarding_complete?: boolean }
    | null
    | undefined,
  currentOrg: { owner_id: string } | null | undefined,
): boolean {
  if (!user || !currentOrg) return false;
  if (user.is_onboarding_complete) return false;
  if (!resolveEstablishedRole(user.role)) return false;
  return currentOrg.owner_id === user.id;
}

/**
 * Resolves which role, if any, should already be selected when the user
 * lands on this page — the account's established role if it has one,
 * otherwise an explicit `?role=` link.
 *
 * The established role wins when it exists: a `?role=` link is just a
 * marketing convenience for accounts that haven't chosen yet. Letting it
 * override an established provider role would let a stray or crafted link
 * silently spin up an unrelated org and overwrite the account's real role.
 *
 * Note this drives *preselection* (skipping the step-0 picker), not the
 * rail lock — the lock additionally depends on membership evidence and on
 * whether an org already exists (see `roleLocked` in page.tsx).
 */
export function resolvePreselectedRole(
  searchParamRole: string | null,
  accountUserRole: string | null | undefined,
): RoleId | null {
  const fromParam =
    searchParamRole && VALID_ROLES.includes(searchParamRole as RoleId)
      ? (searchParamRole as RoleId)
      : null;
  return resolveEstablishedRole(accountUserRole) ?? fromParam;
}

export interface StepDef {
  label: string;
  title: string;
}

export interface RoleDef {
  id: RoleId;
  label: string;
  badge: string;
  color: string;
  steps: StepDef[];
}

export const ROLES: RoleDef[] = [
  {
    id: "member",
    label: "Member",
    badge: "Consumer",
    color: "var(--consumer)",
    steps: [
      { label: "Step 01", title: "What brings you here?" },
      { label: "Step 02", title: "Where do you train?" },
      { label: "Step 03", title: "When do you train?" },
      { label: "Step 04", title: "You're all set" },
    ],
  },
  {
    id: "trainer",
    label: "Trainer",
    badge: "Active",
    color: "var(--trainer)",
    steps: [
      { label: "Step 01", title: "Tell us about yourself" },
      { label: "Step 02", title: "Your specializations" },
      { label: "Step 03", title: "Upload certifications" },
      { label: "Step 04", title: "Set your pricing" },
      { label: "Step 05", title: "Connect your payout" },
      { label: "Step 06", title: "Preview & publish" },
    ],
  },
  {
    id: "gym",
    label: "Gym / studio",
    badge: "Business",
    color: "var(--gym)",
    steps: [
      { label: "Step 01", title: "Business details" },
      { label: "Step 02", title: "Add your first location" },
      { label: "Step 03", title: "Membership plans" },
      { label: "Step 04", title: "Verification documents" },
      { label: "Step 05", title: "Connect your payments" },
      { label: "Step 06", title: "Pick your kiosk" },
      { label: "Step 07", title: "Invite your staff" },
      { label: "Step 08", title: "Submit for review" },
    ],
  },
  {
    id: "dietitian",
    label: "Dietitian",
    badge: "Licensed",
    color: "var(--dietitian)",
    steps: [
      { label: "Step 01", title: "Your practice basics" },
      { label: "Step 02", title: "Licensure" },
      { label: "Step 03", title: "Your specializations" },
      { label: "Step 04", title: "Seed your library" },
      { label: "Step 05", title: "Set your consultation" },
      { label: "Step 06", title: "Connect your payout" },
      { label: "Step 07", title: "Preview & publish" },
    ],
  },
];

export const GENERIC_STEPS: StepDef[] = [
  { label: "Step 01", title: "Pick your role" },
  { label: "Step 02", title: "Account basics" },
  { label: "Step 03", title: "Your practice" },
  { label: "Step 04", title: "Verification & payouts" },
  { label: "Step 05", title: "Preview & go live" },
];

export const ROLE_CARDS = [
  {
    id: "member" as RoleId,
    title: "Member",
    desc: "Find gyms, book trainers, track progress, and manage your fitness journey.",
    meta: "Consumer · free to browse",
    color: "var(--consumer)",
  },
  {
    id: "trainer" as RoleId,
    title: "Personal trainer",
    desc: "List your services, manage clients, take bookings, and get paid, all in one place.",
    meta: "Individual · provider",
    color: "var(--trainer)",
  },
  {
    id: "gym" as RoleId,
    title: "Gym / studio",
    desc: "Manage locations, memberships, staff, check-ins, and revenue from a single dashboard.",
    meta: "Business · multi-location",
    color: "var(--gym)",
  },
  {
    id: "dietitian" as RoleId,
    title: "Dietitian",
    desc: "Build meal plans, consult clients, track adherence, and grow your practice online.",
    meta: "Licensed · provider",
    color: "var(--dietitian)",
  },
];
