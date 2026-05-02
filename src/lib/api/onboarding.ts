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

export const onboardingService = {
  async getStatus(): Promise<ApiResponse<OnboardingStatus>> {
    return await apiClient.get<OnboardingStatus>("/onboarding/status");
  },
  async dismiss(): Promise<ApiResponse<DismissOnboardingResponse>> {
    return await apiClient.post<DismissOnboardingResponse>(
      "/onboarding/dismiss",
      {},
    );
  },
};
