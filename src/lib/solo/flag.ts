/**
 * Client switch for the solo-member web experience. Mirrors the mobile app's
 * EXPO_PUBLIC_FEATURE_SOLO_MEMBER.
 *
 * Default OFF everywhere (including local dev): with it off the member app is
 * exactly what it was, no solo reads are made and no solo link is shown. Only
 * "true", "1" and "on" switch it on. It is a build-time value, so the
 * variable is read as a literal property for Next.js to inline.
 *
 * This is separate from the server flags (solo_water, solo_checklist, ...),
 * which gate each card and page one by one.
 */
export function isSoloMemberEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_FEATURE_SOLO_MEMBER?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "on";
}

/** The server flags the solo web reads from GET /feature-flags/me. */
export const SOLO_FLAGS = {
  fasting: "solo_fasting",
  water: "solo_water",
  checklist: "solo_checklist",
  journal: "solo_journal",
  goals: "solo_goals",
  history: "solo_history",
  targets: "solo_targets",
} as const;
export type SoloFlagKey = (typeof SOLO_FLAGS)[keyof typeof SOLO_FLAGS];
