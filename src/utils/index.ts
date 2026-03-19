/**
 * Utils Layer
 * Canonical barrel export for all pure utility functions.
 */

export { formatDate, formatDateShort, signedChange, formatCurrency } from "./format";
export { parseJWT, isTokenExpired, getTokenExpiryMs } from "./jwt";
export type { JWTPayload } from "./jwt";
export { pMap } from "./async";

// Re-export existing utils
export { decodeHtmlEntities, decodeObjectEntities } from "@/lib/utils";
export { tokenStorage, refreshTokenStorage, userStorage, clearAuthStorage, isAuthenticated } from "@/lib/utils/storage";
