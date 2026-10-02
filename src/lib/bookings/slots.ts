import type { ApiResponse } from "@/lib/types";

/**
 * The API's code for a start time the provider doesn't offer for that
 * session type: outside their hours, a blocked day, off the slot grid or
 * inside the minimum notice. Sent with a 400. A slot that is offered but
 * already taken is a 409 instead.
 */
export const SLOT_NOT_OFFERED = "CONSULTATION_SLOT_UNAVAILABLE";

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
  return res.code === SLOT_NOT_OFFERED || res.status === 409;
}
