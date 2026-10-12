import type { ApiResponse } from "@/lib/types";

/**
 * The API's code for a start time the provider doesn't offer for that
 * session type: outside their working hours, a day off, a session that would
 * run past the end of the day, off the slot grid, or inside the minimum
 * notice. Sent with a 400, and the message says which; show it as sent.
 * The server holds everyone to these hours (members, providers and gym
 * staff alike), so a refusal means the open times have changed.
 */
export const SLOT_NOT_OFFERED = "CONSULTATION_SLOT_UNAVAILABLE";

/** The API's code for an offered time someone else just took (409). */
export const SLOT_TAKEN = "CONSULTATION_SLOT_TAKEN";

/**
 * The LOCAL calendar day, YYYY-MM-DD, which is what the slots endpoint's
 * dateFrom/dateTo take. toISOString() gives the UTC day, which east of UTC
 * is the day before at local midnight.
 */
export function localDayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The local wall-clock time of an instant, HH:mm (24-hour). */
export function localTimeKey(iso: string | Date): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Whether a failed booking or reschedule was refused because of the time
 * itself (not offered, or just taken), so the open times are worth
 * re-fetching.
 */
export function isSlotRefusal(
  res: Pick<ApiResponse<unknown>, "success" | "code" | "status">,
): boolean {
  if (res.success) return false;
  return (
    res.code === SLOT_NOT_OFFERED ||
    res.code === SLOT_TAKEN ||
    res.status === 409
  );
}
