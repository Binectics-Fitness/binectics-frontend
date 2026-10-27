import type { ApiResponse } from "@/lib/types";

/** The API answers a second start with 409 STARTER_ALREADY_ACTIVE. */
export const isStarterAlreadyActive = (res: Pick<ApiResponse, "code">): boolean =>
  res.code === "STARTER_ALREADY_ACTIVE";

const BY_CODE: Record<string, string> = {
  STARTER_ALREADY_ACTIVE:
    "You already have a starter program running. Finish or leave it before starting another.",
  STARTER_SAFETY_REQUIRED: "Please confirm you are 18 or older and have read the safety note.",
  STARTER_BAD_START_DATE: "That start date is not allowed. Pick today or a day in the next two weeks.",
  STARTER_NOT_FOUND: "That program is not available any more. Pick another one.",
  STARTER_NOT_ACTIVE: "That program has already ended.",
  STARTER_SHARE_NOT_LINKED: "You can only share with a coach you are connected to.",
  EXPORT_TOO_LARGE: "Your history is too large for one download. Try again later or contact support.",
};

/** A plain sentence for a failed starter call. */
export function starterErrorMessage(
  res: Pick<ApiResponse, "code" | "message" | "status">,
  fallback: string,
): string {
  if (res.code && BY_CODE[res.code]) return BY_CODE[res.code];
  if (res.status === 429) return "That was too many tries in a short time. Wait a minute and try again.";
  return res.message?.trim() || fallback;
}
