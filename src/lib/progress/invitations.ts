/**
 * Pure helpers for the member-facing "Requests & invitations" surface.
 *
 * Both payloads reference the inviting professional by a field that is either
 * a raw id string or a populated user object, depending on the endpoint and
 * whether the ref resolved. Resolving that shape (and the invitation expiry
 * window) is the only real logic on the page, so it lives here where it can be
 * tested without mounting React.
 */

import type { ClientInvitation, ClientRequestItem } from "@/lib/api/progress";

/** A populated user ref as the progress endpoints return it. */
export interface PersonRef {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_picture?: string;
}

/**
 * Display name for a possibly-unpopulated user ref.
 *
 * Falls back through name → email → the caller's placeholder, so an
 * unpopulated ref never leaks a raw Mongo id into the UI.
 */
export function personName(
  ref: string | PersonRef | undefined | null,
  fallback = "Someone",
): string {
  if (!ref || typeof ref === "string") return fallback;

  const name = [ref.first_name, ref.last_name]
    .filter((part) => Boolean(part?.trim()))
    .join(" ")
    .trim();
  if (name) return name;

  const email = ref.email?.trim();
  return email || fallback;
}

/** Who is asking to add me as a client. */
export function requesterName(request: ClientRequestItem): string {
  return personName(request.professional_id, "A provider");
}

/** Who invited me. */
export function inviterName(invitation: ClientInvitation): string {
  return personName(invitation.invited_by, "A provider");
}

/**
 * Whether an invitation's window has closed.
 *
 * An unparseable or missing date is treated as NOT expired: the server is the
 * authority on expiry, and hiding a live invitation because of a bad string
 * is worse than showing one the accept call will reject.
 */
export function isInvitationExpired(
  expiresAt: string | undefined | null,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() <= now.getTime();
}

/**
 * Whole days left before an invitation expires — 0 once it is expiring today
 * or already gone, null when there is no usable date.
 */
export function daysUntilExpiry(
  expiresAt: string | undefined | null,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;
  const ms = expiry.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / 86_400_000);
}

/** "Expires today" / "Expires in 3 days" / "Expired" — or null when unknown. */
export function expiryLabel(
  expiresAt: string | undefined | null,
  now: Date = new Date(),
): string | null {
  const days = daysUntilExpiry(expiresAt, now);
  if (days === null) return null;
  if (isInvitationExpired(expiresAt, now)) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires in 1 day";
  return `Expires in ${days} days`;
}
