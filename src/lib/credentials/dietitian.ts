/**
 * A dietitian's credentials (API: /credentials/me, GET /credentials/options).
 *
 * Specializations and populations are controlled codes; these labels are
 * the chips onboarding has always shown and match GET /credentials/options.
 * The API refuses any other code, so the lists here can only lag it, never
 * invent one: an unknown code from the API is shown as itself.
 */

import type { components } from "@/lib/api/generated/schema";

export const DIETITIAN_SPECIALIZATIONS = [
  { code: "pcos", label: "PCOS" },
  { code: "diabetes", label: "Diabetes" },
  { code: "sport_performance", label: "Sport performance" },
  { code: "gestational", label: "Gestational" },
  { code: "ibs_fodmap", label: "IBS · FODMAP" },
  { code: "pre_post_natal", label: "Pre/post-natal" },
  { code: "weight_management", label: "Weight management" },
  { code: "cardiovascular", label: "Cardiovascular" },
  { code: "renal", label: "Renal" },
  { code: "paediatric", label: "Paediatric" },
  { code: "eating_disorders", label: "Eating disorders" },
] as const;

export const DIETITIAN_POPULATIONS = [
  { code: "adults", label: "Adults" },
  { code: "athletes", label: "Athletes" },
  { code: "children", label: "Children" },
  { code: "pre_post_natal", label: "Pre/post-natal" },
  { code: "seniors", label: "Seniors" },
] as const;

export type DietitianSpecialization = (typeof DIETITIAN_SPECIALIZATIONS)[number]["code"];
export type DietitianPopulation = (typeof DIETITIAN_POPULATIONS)[number]["code"];

// The lists above must be exactly the API's (generated from its OpenAPI):
// a code missing on either side fails the type check after `api:sync`.
type ApiCredentials = components["schemas"]["UpdateCredentialsDto"];
type ApiSpecialization = NonNullable<ApiCredentials["specializations"]>[number];
type ApiPopulation = NonNullable<ApiCredentials["populations"]>[number];
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const SPECIALIZATIONS_MATCH_API: Same<ApiSpecialization, DietitianSpecialization> = true;
export const POPULATIONS_MATCH_API: Same<ApiPopulation, DietitianPopulation> = true;

/** "Up to 5. Members filter on these." The API enforces it too. */
export const MAX_SPECIALIZATIONS = 5;
export const MAX_PRONOUNS = 40;
export const MAX_LICENSES = 10;

const SPEC_LABEL: Record<string, string> = Object.fromEntries(DIETITIAN_SPECIALIZATIONS.map((s) => [s.code, s.label]));
const POP_LABEL: Record<string, string> = Object.fromEntries(DIETITIAN_POPULATIONS.map((p) => [p.code, p.label]));
const SPEC_CODE: Record<string, string> = Object.fromEntries(DIETITIAN_SPECIALIZATIONS.map((s) => [s.label, s.code]));
const POP_CODE: Record<string, string> = Object.fromEntries(DIETITIAN_POPULATIONS.map((p) => [p.label, p.code]));

export function specializationLabel(code: string): string {
  return SPEC_LABEL[code] ?? code;
}
export function populationLabel(code: string): string {
  return POP_LABEL[code] ?? code;
}
export function specializationCode(label: string): string | undefined {
  return SPEC_CODE[label];
}
export function populationCode(label: string): string | undefined {
  return POP_CODE[label];
}

/** Adds or removes a code, never past `max`. */
export function toggleCode(list: string[], code: string, max?: number): string[] {
  if (list.includes(code)) return list.filter((c) => c !== code);
  if (max && list.length >= max) return list;
  return [...list, code];
}

/** A licence as its owner reads it (GET /credentials/me). */
export interface LicenseView {
  _id: string;
  name: string;
  issuing_body: string;
  number: string | null;
  country_code: string;
  expires_at: string;
  is_current: boolean;
  has_document: boolean;
  /** A short-lived signed link; open it, never send it back. */
  document_url: string | null;
}

export interface CredentialsView {
  user_id: string;
  pronouns: string | null;
  specializations: string[];
  populations: string[];
  licenses: LicenseView[];
  document_url_expires_in_seconds: number;
  updated_at: string | null;
}

/**
 * A licence in a PATCH. Keep `_id` to keep a licence (and its document when
 * `document_url` is left out); `document_url` is the url POST
 * /upload/document returned, or null to remove the document.
 */
export interface LicenseInput {
  _id?: string;
  name: string;
  issuing_body: string;
  number?: string;
  country_code: string;
  /** yyyy-mm-dd */
  expires_at: string;
  document_url?: string | null;
}

/** PATCH /credentials/me: fields sent replace what is stored. */
export interface UpdateCredentialsRequest {
  pronouns?: string;
  specializations?: string[];
  populations?: string[];
  licenses?: LicenseInput[];
}

/** A licence as a form edits it: every field a string. */
export interface LicenseDraft {
  _id?: string;
  name: string;
  issuingBody: string;
  number: string;
  countryCode: string;
  expiresAt: string;
  /** A fresh upload's reference url, to send. */
  newDocumentUrl?: string;
  /** Remove the document already on file. */
  removeDocument?: boolean;
  /** For display: a document is on file. */
  hasDocument?: boolean;
}

export function emptyLicenseDraft(countryCode = ""): LicenseDraft {
  return { name: "", issuingBody: "", number: "", countryCode, expiresAt: "" };
}

export function licenseDraftFrom(view: LicenseView): LicenseDraft {
  return {
    _id: view._id,
    name: view.name,
    issuingBody: view.issuing_body,
    number: view.number ?? "",
    countryCode: view.country_code,
    expiresAt: (view.expires_at ?? "").slice(0, 10),
    hasDocument: view.has_document,
  };
}

/** True when nothing was typed or uploaded for this licence. */
export function isBlankLicense(d: LicenseDraft): boolean {
  return !d.name.trim() && !d.issuingBody.trim() && !d.number.trim() && !d.expiresAt && !d.newDocumentUrl;
}

/**
 * What is missing before a licence can be saved, or null. The API needs a
 * name, issuing body, two-letter country and an expiry date.
 */
export function licenseDraftError(d: LicenseDraft): string | null {
  const missing: string[] = [];
  if (!d.name.trim()) missing.push("the licence name");
  if (!d.issuingBody.trim()) missing.push("who issued it");
  if (!/^[A-Za-z]{2}$/.test(d.countryCode.trim())) missing.push("the country");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.expiresAt)) missing.push("the expiry date");
  if (missing.length === 0) return null;
  return `Add ${missing.join(", ").replace(/, ([^,]*)$/, " and $1")}.`;
}

/** The PATCH body for a licence draft. */
export function licenseInputFrom(d: LicenseDraft): LicenseInput {
  const out: LicenseInput = {
    name: d.name.trim(),
    issuing_body: d.issuingBody.trim(),
    country_code: d.countryCode.trim().toUpperCase(),
    expires_at: d.expiresAt,
  };
  if (d._id) out._id = d._id;
  if (d.number.trim()) out.number = d.number.trim();
  if (d.newDocumentUrl) out.document_url = d.newDocumentUrl;
  else if (d.removeDocument) out.document_url = null;
  return out;
}

/** "Licensed · DAN (NG), HPCSA (ZA)" style summary of public badges. */
export function licenseBadgeSummary(badges: { issuing_body: string; country_code: string }[] | undefined): string {
  return (badges ?? []).map((b) => (b.country_code ? `${b.issuing_body} (${b.country_code})` : b.issuing_body)).join(", ");
}
