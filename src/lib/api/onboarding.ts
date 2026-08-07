import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export interface OnboardingStep {
  id: string;
  is_complete: boolean;
  is_required: boolean;
}

export interface OnboardingStatus {
  steps: OnboardingStep[];
  completed_count: number;
  total_count: number;
  is_complete: boolean;
  is_dismissed: boolean;
}

export interface DismissOnboardingResponse {
  dismissed_at: string;
}

export interface WalkthroughDismissalResponse {
  is_dismissed: boolean;
}

export const onboardingService = {
  async getStatus(): Promise<ApiResponse<OnboardingStatus>> {
    return await apiClient.get<OnboardingStatus>("/onboarding/status");
  },
  /**
   * Finishes the setup wizard (marks onboarding complete). Distinct from
   * hiding the walkthrough banner — see walkthroughDismiss.
   */
  async dismiss(): Promise<ApiResponse<DismissOnboardingResponse>> {
    return await apiClient.post<DismissOnboardingResponse>(
      "/onboarding/dismiss",
      {},
    );
  },
  /**
   * Hides the walkthrough banner for this user, cross-device. Does NOT mark
   * setup complete; reversible via walkthroughReopen.
   */
  async walkthroughDismiss(): Promise<ApiResponse<WalkthroughDismissalResponse>> {
    return await apiClient.post<WalkthroughDismissalResponse>(
      "/onboarding/walkthrough/dismiss",
      {},
    );
  },
  /** Brings the walkthrough banner back after it was dismissed. */
  async walkthroughReopen(): Promise<ApiResponse<WalkthroughDismissalResponse>> {
    return await apiClient.post<WalkthroughDismissalResponse>(
      "/onboarding/walkthrough/reopen",
      {},
    );
  },
};
