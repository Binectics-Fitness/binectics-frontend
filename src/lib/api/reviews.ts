import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export enum ReviewTargetType {
  GYM = "GYM",
  TRAINER = "TRAINER",
  DIETICIAN = "DIETICIAN",
}

export enum ReviewStatus {
  VISIBLE = "VISIBLE",
  HIDDEN = "HIDDEN",
  REMOVED = "REMOVED",
}

export interface ReviewReply {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface Review {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  reviewerUserId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  sourceBookingId?: string;
  sourceSubscriptionId?: string;
  providerResponse?: {
    message: string;
    createdAt: string;
  };
  replies?: ReviewReply[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewAggregate {
  targetType: ReviewTargetType;
  targetId: string;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown?: Record<string, number>;
}

export interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  sourceBookingId?: string;
  sourceSubscriptionId?: string;
}

export interface GetTargetReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReviewRequest {
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment?: string;
  sourceBookingId?: string;
  sourceSubscriptionId?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface CreateReviewReportRequest {
  reason: string;
  details?: string;
}

export interface CreateProviderResponseRequest {
  message: string;
}

export interface CreateReviewReplyRequest {
  message: string;
}

export const reviewsService = {
  getTargetAggregate(
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ApiResponse<ReviewAggregate>> {
    return apiClient.get<ReviewAggregate>(
      `/reviews/targets/${targetType}/${targetId}/aggregate`,
      false,
    );
  },

  getTargetReviews(
    targetType: ReviewTargetType,
    targetId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: "newest" | "oldest" | "rating_high" | "rating_low";
    },
  ): Promise<ApiResponse<GetTargetReviewsResponse>> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set("page", String(params.page));
    if (params?.limit != null) search.set("limit", String(params.limit));
    if (params?.sort) search.set("sort", params.sort);

    const query = search.toString();
    return apiClient.get<GetTargetReviewsResponse>(
      `/reviews/targets/${targetType}/${targetId}${query ? `?${query}` : ""}`,
      false,
    );
  },

  getEligibility(
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ApiResponse<ReviewEligibility>> {
    return apiClient.get<ReviewEligibility>(
      `/reviews/targets/${targetType}/${targetId}/eligibility`,
    );
  },

  createReview(data: CreateReviewRequest): Promise<ApiResponse<Review>> {
    return apiClient.post<Review>("/reviews", data);
  },

  updateReview(
    reviewId: string,
    data: UpdateReviewRequest,
  ): Promise<ApiResponse<Review>> {
    return apiClient.patch<Review>(`/reviews/${reviewId}`, data);
  },

  deleteReview(reviewId: string): Promise<ApiResponse<unknown>> {
    return apiClient.delete(`/reviews/${reviewId}`);
  },

  reportReview(
    reviewId: string,
    data: CreateReviewReportRequest,
  ): Promise<ApiResponse<unknown>> {
    return apiClient.post(`/reviews/${reviewId}/report`, data);
  },

  createProviderResponse(
    reviewId: string,
    data: CreateProviderResponseRequest,
  ): Promise<ApiResponse<Review>> {
    return apiClient.post<Review>(
      `/reviews/${reviewId}/provider-response`,
      data,
    );
  },

  addReply(
    reviewId: string,
    data: CreateReviewReplyRequest,
  ): Promise<ApiResponse<Review>> {
    return apiClient.post<Review>(`/reviews/${reviewId}/replies`, data);
  },
};
