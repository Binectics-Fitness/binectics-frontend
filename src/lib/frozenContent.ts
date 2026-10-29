import type { ApiResponse } from "@/lib/types";

/**
 * One experience for "access ended, so this is read-only until renewed".
 *
 * The API has two wire codes for it and they stay as they are:
 *  - CONTENT_ACCESS_FROZEN: a paid program or meal plan whose access ended
 *    (client task actions, meal-plan updates, provider resume).
 *  - PROGRAM_FROZEN_LAPSED: a program frozen because the client's paid link
 *    lapsed (provider pause/resume/complete/cancel).
 * Neither carries an offer, so the renew action goes to the member's
 * billing page. Keep this copy identical to the mobile app's.
 */
export const FROZEN_CODES = ["CONTENT_ACCESS_FROZEN", "PROGRAM_FROZEN_LAPSED"] as const;

export const FROZEN_TITLE = "Renew to keep your plan going";
export const FROZEN_MESSAGE =
  "Access has ended, so this is on hold. Renew to keep it going; everything done so far stays here to read.";
export const FROZEN_RENEW_LABEL = "See how to renew";
/** Where "See how to renew" goes. */
export const FROZEN_RENEW_HREF = "/dashboard/member/billing";

/** True when the API refused because access ended (either wire code). */
export function isFrozenResponse(res: Pick<ApiResponse, "code"> | null | undefined): boolean {
  return !!res?.code && (FROZEN_CODES as readonly string[]).includes(res.code);
}

/** The frozen sentence for a frozen refusal, else the API's own message, else `fallback`. */
export function frozenMessage(
  res: Pick<ApiResponse, "code" | "message">,
  fallback: string,
): string {
  if (isFrozenResponse(res)) return FROZEN_MESSAGE;
  return res.message?.trim() || fallback;
}
