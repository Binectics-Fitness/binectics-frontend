/**
 * Whether a session type can't be repeated: a priced session is a 30-minute
 * unpaid hold that has to be paid on its own, so a repeat would leave a row
 * of holds that lapse. Free sessions only, as on the app.
 */
export function repeatBlockedForPaid(type: { priceMinor?: number | null } | null | undefined): boolean {
  return (type?.priceMinor ?? 0) > 0;
}
