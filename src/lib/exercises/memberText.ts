import { MEMBER_TEXT_APPROVED_IDS } from "@/lib/exercises/memberTextAllowlist.generated";

/**
 * Which exercises may show their WRITTEN text (steps, cues, common mistakes,
 * safety lines, easier/harder text) to a member or client. Pictures, names and
 * factual metadata (equipment, muscle groups) are not governed by this.
 *
 * One list, owned by the API (member-text-allowlist.json). The API sends it as
 * `member_text_approved` on each library row; for bundled and offline content
 * (the Starter program) this app keeps a generated copy. Fails CLOSED: an id
 * in neither list is not approved. This gate only ever REMOVES text; the
 * `exercise_guidance_for_members` flag stays the master switch on top of it.
 * Providers (trainers, dietitians, gym staff) are not gated.
 */

/** Shown in place of withheld written text. Draft, needs copy review. */
export const WITHHELD_TEXT_LINE = "Written steps for this exercise are not available yet.";

const APPROVED = new Set<string>(MEMBER_TEXT_APPROVED_IDS);

/** Bundled-list check only: for content that ships in the app. */
export function bundledTextApproved(id?: string | null): boolean {
  return !!id && APPROVED.has(id);
}

/**
 * May a member see this exercise's written text? The API's per-exercise field
 * wins when it is present (fresh data); an API that does not send it falls
 * back to the bundled list. Unknown ids are withheld.
 */
export function memberTextApproved(id?: string | null, apiField?: boolean | null): boolean {
  if (!id) return false;
  if (typeof apiField === "boolean") return apiField;
  return bundledTextApproved(id);
}
