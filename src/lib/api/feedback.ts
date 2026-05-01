/**
 * Feedback API Service — user-facing CSAT submission and prompt status.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export type FeedbackPromptContext =
  | "post_onboarding"
  | "periodic"
  | "post_subscription";

export interface SubmitFeedbackRequest {
  score: number; // 1-5
  comment?: string;
  prompt_context?: FeedbackPromptContext;
}

export interface FeedbackPromptStatus {
  shouldPrompt: boolean;
  nextEligibleAt: string;
}

export const feedbackService = {
  submit: (data: SubmitFeedbackRequest): Promise<ApiResponse<unknown>> =>
    apiClient.post("/feedback", data),

  getPromptStatus: (): Promise<ApiResponse<FeedbackPromptStatus>> =>
    apiClient.get<FeedbackPromptStatus>("/feedback/prompt-status"),
};
