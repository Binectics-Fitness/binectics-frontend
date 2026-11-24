/**
 * Pure rules for the provider tracks (gym, trainer, dietitian) that the
 * onboarding page and its steps share. Kept apart from _config.ts so the
 * member track's file is left alone.
 */
import { MembershipPlanType } from "@/lib/types";
import type { CreateOrgMembershipPlanRequest, CreateListingRequest } from "@/lib/api/marketplace";
import { specializationLabel } from "@/lib/credentials/dietitian";
import { onboardingCurrency } from "./_config";

/* ── Gym: membership plan templates ─────────────────────────── */

/**
 * How many plans each template adds. Mirrors the API's TEMPLATES in
 * TeamsService.seedMembershipPlanTemplate: a template over the owner's plan
 * cap is refused there ("This template adds 3 membership plans but your plan
 * allows 2"), so the step only offers the ones that fit.
 */
export const PLAN_TEMPLATE_SIZES: Record<string, number> = {
  standard: 3,
  boutique: 4,
  crossfit: 2,
  blank: 0,
};

/** True when the template fits a plan cap; null is no cap (or not known yet). */
export function planTemplateFits(template: string, cap: number | null): boolean {
  if (cap === null) return true;
  return (PLAN_TEMPLATE_SIZES[template] ?? 0) <= cap;
}

/**
 * The template the step starts on: the standard set when it fits, else
 * Start blank. Never a niche template (CrossFit) picked for the owner just
 * because it is small.
 */
export function defaultPlanTemplate(cap: number | null): string {
  return planTemplateFits("standard", cap) ? "standard" : "blank";
}

/* ── Gym: staff invites ─────────────────────────────────────── */

/** Data key: the emails invited so far, so a retry never invites twice. */
export const STAFF_INVITED = "staffInvited";

/** The emails typed on the staff step, one per line or comma separated, deduplicated. */
export function staffInviteEmails(data: Record<string, unknown>): string[] {
  const raw = (data.staffEmails as string) || "";
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)) {
    const key = e.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  }
  return out;
}

/** The emails already invited during this onboarding. */
export function staffInvited(data: Record<string, unknown>): string[] {
  const v = data[STAFF_INVITED];
  return Array.isArray(v) ? v.filter((e): e is string => typeof e === "string") : [];
}

/**
 * What the staff step tells the owner when invites were refused. One reason
 * is said once (the Free plan refuses every invite with the same message).
 */
export function staffInviteError(failures: { email: string; message?: string }[]): string | null {
  if (failures.length === 0) return null;
  const reasons = Array.from(new Set(failures.map((f) => f.message).filter(Boolean)));
  const who = failures.length === 1 ? failures[0].email : `${failures.length} invites`;
  const why = reasons.length === 1 ? reasons[0] : "Check the addresses and try again.";
  return `We couldn't send ${who}. ${why} Remove ${failures.length === 1 ? "it" : "them"} to continue.`;
}

/* ── Gym: country-specific wording ──────────────────────────── */

/**
 * Business types by country (ISO 3166-1 alpha-2). A country not listed gets
 * the generic set; there is no one country's list for everyone.
 */
const LEGAL_ENTITIES: Record<string, string[]> = {
  NG: ["Business name (sole proprietor)", "Private limited company (Ltd)", "Public limited company (Plc)", "Partnership", "Incorporated trustees"],
  ZA: ["Private company (Pty) Ltd", "Sole proprietor", "Partnership", "Close corporation (CC)", "Non-profit company (NPC)"],
  KE: ["Sole proprietor", "Private limited company (Ltd)", "Partnership", "Limited liability partnership (LLP)"],
  GH: ["Sole proprietor", "Private limited company", "Partnership", "Company limited by guarantee"],
  US: ["Sole proprietor", "LLC", "Corporation (Inc.)", "Partnership"],
  GB: ["Sole trader", "Private limited company (Ltd)", "Partnership", "Limited liability partnership (LLP)"],
};
const GENERIC_ENTITIES = ["Sole proprietor", "Limited company", "Partnership", "Non-profit", "Other"];

export function legalEntityOptions(countryCode: string | undefined): string[] {
  return (countryCode && LEGAL_ENTITIES[countryCode]) || GENERIC_ENTITIES;
}

const REGISTRATION_PLACEHOLDER: Record<string, string> = {
  NG: "RC 1234567",
  ZA: "2018/123456/07",
  KE: "PVT-ABC1234",
  GB: "01234567",
};

export function registrationPlaceholder(countryCode: string | undefined): string {
  return (countryCode && REGISTRATION_PLACEHOLDER[countryCode]) || "Company registration number";
}

const OWNER_ID_HINT: Record<string, string> = {
  NG: "NIN slip, international passport or driver's licence",
  ZA: "South African ID or passport",
  KE: "National ID or passport",
  GH: "Ghana Card or passport",
  US: "Driver's license or passport",
  GB: "Passport or driving licence",
};

export function ownerIdHint(countryCode: string | undefined): string {
  return (countryCode && OWNER_ID_HINT[countryCode]) || "Government-issued ID or passport";
}

/* ── Trainer: the monthly online plan ───────────────────────── */

/** The plan the trainer's monthly online price becomes. */
export const ONLINE_PLAN_NAME = "Online coaching (monthly)";

/**
 * The monthly online price as a 30-day subscription plan (what the Packages
 * page sells), or null when no price was typed. Session packs are not asked
 * for: a plan has no session count, so a "4-session pack" would promise
 * something nothing counts.
 */
export function trainerMonthlyPlan(data: Record<string, unknown>): CreateOrgMembershipPlanRequest | null {
  const minor = data.priceMonthlyMinor;
  const currency = onboardingCurrency(data);
  if (typeof minor !== "number" || !Number.isInteger(minor) || minor <= 0 || !currency) return null;
  return {
    name: ONLINE_PLAN_NAME,
    plan_type: MembershipPlanType.SUBSCRIPTION,
    duration_days: 30,
    price_minor: minor,
    currency,
  };
}

/* ── Trainer and dietitian: the marketplace listing ─────────── */

/** The listing step's own fields. */
export const LISTING_HEADLINE = "headline";
export const LISTING_BIO = "bio";

/** The name the preview shows: what was typed, else the account's name. */
export function providerDisplayName(
  role: "trainer" | "dietitian",
  data: Record<string, unknown>,
  user: { first_name?: string; last_name?: string } | null | undefined,
): string {
  const account = [user?.first_name, user?.last_name].map((s) => (s ?? "").trim()).filter(Boolean).join(" ");
  if (role === "dietitian") return ((data.fullName as string) || "").trim() || account;
  const typed = [data.firstName, data.lastName].map((s) => ((s as string) || "").trim()).filter(Boolean).join(" ");
  return typed || account;
}

/**
 * What onboarding puts on the trainer's or dietitian's marketplace listing,
 * or null when the headline or bio (both required by the API) is missing.
 */
export function onboardingListing(
  role: "trainer" | "dietitian",
  data: Record<string, unknown>,
  countryCode: string | undefined,
): CreateListingRequest | null {
  const headline = ((data[LISTING_HEADLINE] as string) || "").trim().slice(0, 200);
  const bio = ((data[LISTING_BIO] as string) || "").trim().slice(0, 3000);
  if (!headline || !bio) return null;
  const codes = (data.specializations as string[] | undefined) ?? [];
  const specialties = role === "dietitian" ? codes.map(specializationLabel) : codes;
  const city = ((data.city as string) || "").trim();
  return {
    account_type: role === "dietitian" ? "dietitian" : "personal_trainer",
    headline,
    bio,
    ...(specialties.length ? { specialties } : {}),
    ...(city ? { city } : {}),
    ...(countryCode ? { country_code: countryCode } : {}),
  };
}

/** The slice of marketplaceService that saving the listing needs. */
export interface ListingApi {
  getMyListing(): Promise<{ success: boolean; status?: number; message?: string; data?: unknown }>;
  createMyListing(payload: CreateListingRequest): Promise<{ success: boolean; message?: string }>;
  updateMyListing(payload: Omit<CreateListingRequest, "account_type">): Promise<{ success: boolean; message?: string }>;
}

/**
 * Creates the listing, or fills the one that exists, and returns an error to
 * show, or null when it was saved. It stays a draft: the provider adds
 * photos and publishes it from My profile.
 */
export async function saveOnboardingListing(payload: CreateListingRequest, api: ListingApi): Promise<string | null> {
  try {
    const mine = await api.getMyListing();
    if (mine.success && mine.data) {
      const { account_type: _ignored, ...patch } = payload;
      void _ignored;
      const res = await api.updateMyListing(patch);
      return res.success ? null : res.message || "We couldn't save your profile. Try again.";
    }
    if (mine.status !== 404) return mine.message || "We couldn't load your profile. Try again.";
    const res = await api.createMyListing(payload);
    return res.success ? null : res.message || "We couldn't create your profile. Try again.";
  } catch {
    return "We couldn't save your profile. Check your connection and try again.";
  }
}

/* ── Trainer and dietitian: the starting country ────────────── */

/**
 * The name of the account's own country (from sign-up) when the track's
 * country list has it, else null and the track's select keeps its default.
 */
export function accountCountryName(code: string | undefined | null, names: Record<string, string>): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return Object.keys(names).find((name) => names[name] === upper) ?? null;
}
