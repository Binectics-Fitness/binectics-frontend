/**
 * Services Layer
 * Canonical barrel export for all API services.
 * The actual implementations live in src/lib/api/.
 */

export { authService } from "@/lib/api/auth";
export type {
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "@/lib/api/auth";

export { formsService } from "@/lib/api/forms";
export type * from "@/lib/api/forms";

export { progressService } from "@/lib/api/progress";
export type * from "@/lib/api/progress";

export { teamsService } from "@/lib/api/teams";
export type * from "@/lib/api/teams";

export { utilityService } from "@/lib/api/utility";
export type * from "@/lib/api/utility";

export { reviewsService } from "@/lib/api/reviews";
export type * from "@/lib/api/reviews";

export { apiClient } from "@/lib/api/client";
