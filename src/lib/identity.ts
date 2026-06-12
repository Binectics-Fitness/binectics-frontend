/**
 * Identity helpers — turn the authenticated User / current Organization into
 * the small bits of display text the dashboard shells need (names, initials,
 * role labels). Centralised so every shell renders identity the same way.
 */

import type { User } from "@/lib/types";

type NameUser = Pick<User, "first_name" | "last_name"> | null | undefined;

/** "Jane Doe" */
export function fullName(user: NameUser): string {
  if (!user) return "";
  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
}

/** "Jane D." — compact form used in sidebar footers */
export function shortName(user: NameUser): string {
  if (!user) return "";
  const initial = user.last_name?.[0];
  return `${user.first_name ?? ""}${initial ? ` ${initial}.` : ""}`.trim();
}

/** "JD" — from a user's first/last name */
export function personInitials(user: NameUser): string {
  if (!user) return "";
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
}

/** "IL" — initials from an arbitrary name (e.g. an organization). */
export function nameInitials(name: string | null | undefined): string {
  if (!name) return "";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || ""
  );
}

/** Uppercase role label shown under the user's name in the sidebar footer. */
export const ROLE_LABEL: Record<string, string> = {
  GYM_OWNER: "OWNER",
  TRAINER: "TRAINER",
  DIETITIAN: "DIETITIAN",
  ADMIN: "ADMIN",
  USER: "MEMBER",
};
