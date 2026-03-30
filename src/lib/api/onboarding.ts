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
}

export const onboardingService = {
  async getStatus(): Promise<ApiResponse<OnboardingStatus>> {
    return await apiClient.get<OnboardingStatus>("/onboarding/status");
  },
};
