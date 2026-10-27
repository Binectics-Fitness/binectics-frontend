/**
 * Feature flag for the Starter Program on web. Mirrors the mobile app's
 * EXPO_PUBLIC_FEATURE_STARTER_PROGRAM.
 *
 * Default: ON outside production builds (local dev, previews built in
 * development mode), OFF in production until the variable is set to "true".
 * "false", "0" and "off" switch it off everywhere. The API independently
 * returns no programs until coach/physio-reviewed (or owner-waived) content
 * is published, so the screens also handle an empty catalogue.
 */
export function isStarterProgramEnabled(): boolean {
  // Must be read as a literal property so Next.js inlines it into the bundle.
  const raw = process.env.NEXT_PUBLIC_FEATURE_STARTER_PROGRAM?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV !== "production";
}
