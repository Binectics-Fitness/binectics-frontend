import type { ApiResponse } from "@/lib/types";

/**
 * The 409s the locations endpoints answer with (api #268), as messages a gym
 * owner can act on. Anything else falls back to the API's own message.
 */
export const LocationErrorCode = {
  PRIMARY: "LOCATION_PRIMARY",
  LAST_ACTIVE: "LOCATION_LAST_ACTIVE",
  NAME_IN_USE: "LOCATION_NAME_IN_USE",
} as const;

export type LocationAction = "save" | "deactivate" | "reactivate";

export function locationErrorMessage(
  res: Pick<ApiResponse, "code" | "message">,
  action: LocationAction,
  locationName: string,
  fallback: string,
): string {
  switch (res.code) {
    case LocationErrorCode.PRIMARY:
      return `"${locationName}" is your primary location. Make another location primary before you deactivate it.`;
    case LocationErrorCode.LAST_ACTIVE:
      return `"${locationName}" is your only active location. Add or reactivate another one before you deactivate it.`;
    case LocationErrorCode.NAME_IN_USE:
      return action === "reactivate"
        ? `Another active location is already called "${locationName}". Rename that one, then reactivate this.`
        : `Another active location is already called "${locationName}". Choose a different name.`;
    default:
      return res.message || fallback;
  }
}
