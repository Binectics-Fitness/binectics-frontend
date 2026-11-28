import { authService } from "@/lib/api/auth";
import type { User } from "@/lib/types";

/**
 * Tells the API the browser's IANA time zone so server-computed dates
 * (e.g. meal-plan "Update clients" effective dates) use the member's own
 * day. Mirrors the mobile app's timeZoneSync: sent only when it differs
 * from what the account holds, 'UTC' is never sent (it is what a device
 * with no zone reports and would hide the gym's zone), and a failure is
 * swallowed. At most one attempt per zone per page session.
 */
let attempted: string | null = null;

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

export async function syncBrowserTimeZone(
  user: Pick<User, "time_zone"> | null | undefined,
  zone: string = browserTimeZone(),
): Promise<boolean> {
  if (!user || !zone || zone === "UTC" || user.time_zone === zone) return false;
  if (attempted === zone) return false;
  attempted = zone;
  try {
    const res = await authService.updateProfile({ time_zone: zone });
    return !!res?.success;
  } catch {
    return false;
  }
}

/** Test hook: forget the per-session guard. */
export function resetTimeZoneSyncGuard(): void {
  attempted = null;
}
