/**
 * Marketplace API Service
 * Handles public listing search, client requests, reviews,
 * and professional listing management.
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  MarketplaceListing,
  MarketplaceRequest,
  MarketplaceReview,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
  MarketplaceAccountType,
  MarketplaceRequestType,
} from "@/lib/types";

// ==================== REQUEST TYPES ====================

export interface CreateListingRequest {
  account_type: MarketplaceAccountType;
  headline: string;
  bio: string;
  specialties?: string[];
  certifications?: string[];
  languages?: string[];
  photos?: string[];
  city?: string;
  country_code?: string;
  address?: string;
  lat?: number;
  lng?: number;
  currency?: string;
  price_from?: number;
  price_label?: string;
  accepting_clients?: boolean;
  max_clients?: number;
}

export interface UpdateListingRequest {
  headline?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  languages?: string[];
  photos?: string[];
  city?: string;
  country_code?: string;
  address?: string;
  lat?: number;
  lng?: number;
  currency?: string;
  price_from?: number;
  price_label?: string;
  accepting_clients?: boolean;
  max_clients?: number;
}

export interface CreateMarketplaceRequestPayload {
  type: MarketplaceRequestType;
  message?: string;
  starting_weight_kg?: number;
  target_weight_kg?: number;
  height_cm?: number;
  goals?: string[];
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface TransferClientRequest {
  from_profile_id: string;
  to_listing_id: string;
  message?: string;
  goals?: string[];
}

// ==================== SERVICE ====================

export const marketplaceService = {
  // ─── Public ───

  async searchListings(
    params: MarketplaceSearchParams,
  ): Promise<ApiResponse<MarketplaceSearchResult>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    });
    return await apiClient.get<MarketplaceSearchResult>(
      `/marketplace/listings?${query.toString()}`,
      false,
    );
  },

  async getListingById(
    id: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.get<MarketplaceListing>(
      `/marketplace/listings/${id}`,
      false,
    );
  },

  async getListingReviews(
    id: string,
    page = 1,
    limit = 20,
  ): Promise<
    ApiResponse<{
      reviews: MarketplaceReview[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    return await apiClient.get(
      `/marketplace/listings/${id}/reviews?page=${page}&limit=${limit}`,
      false,
    );
  },

  // ─── Client Actions (Authenticated) ───

  async sendRequest(
    listingId: string,
    data: CreateMarketplaceRequestPayload,
  ): Promise<ApiResponse<MarketplaceRequest>> {
    return await apiClient.post<MarketplaceRequest>(
      `/marketplace/listings/${listingId}/request`,
      data,
    );
  },

  async getMyRequests(): Promise<ApiResponse<MarketplaceRequest[]>> {
    return await apiClient.get<MarketplaceRequest[]>(
      "/marketplace/my-requests",
    );
  },

  async cancelRequest(requestId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/marketplace/requests/${requestId}`,
    );
  },

  async transferClient(
    data: TransferClientRequest,
  ): Promise<ApiResponse<MarketplaceRequest>> {
    return await apiClient.post<MarketplaceRequest>(
      "/marketplace/transfer",
      data,
    );
  },

  // ─── Reviews (Authenticated) ───

  async createReview(
    listingId: string,
    data: CreateReviewRequest,
  ): Promise<ApiResponse<MarketplaceReview>> {
    return await apiClient.post<MarketplaceReview>(
      `/marketplace/listings/${listingId}/reviews`,
      data,
    );
  },

  async updateReview(
    reviewId: string,
    data: UpdateReviewRequest,
  ): Promise<ApiResponse<MarketplaceReview>> {
    return await apiClient.patch<MarketplaceReview>(
      `/marketplace/reviews/${reviewId}`,
      data,
    );
  },

  async deleteReview(reviewId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/marketplace/reviews/${reviewId}`,
    );
  },

  // ─── Solo Professional Management ───

  async createMyListing(
    data: CreateListingRequest,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.post<MarketplaceListing>(
      "/marketplace/my-listing",
      data,
    );
  },

  async getMyListing(): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.get<MarketplaceListing>(
      "/marketplace/my-listing",
    );
  },

  async updateMyListing(
    data: UpdateListingRequest,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      "/marketplace/my-listing",
      data,
    );
  },

  async publishMyListing(): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      "/marketplace/my-listing/publish",
    );
  },

  async unpublishMyListing(): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      "/marketplace/my-listing/unpublish",
    );
  },

  async getMyListingRequests(): Promise<
    ApiResponse<MarketplaceRequest[]>
  > {
    return await apiClient.get<MarketplaceRequest[]>(
      "/marketplace/my-listing/requests",
    );
  },

  async getMyListingRequestDetail(
    requestId: string,
  ): Promise<ApiResponse<MarketplaceRequest>> {
    return await apiClient.get<MarketplaceRequest>(
      `/marketplace/my-listing/requests/${requestId}`,
    );
  },

  async acceptRequest(
    requestId: string,
    responseNote?: string,
  ): Promise<ApiResponse<MarketplaceRequest>> {
    return await apiClient.patch<MarketplaceRequest>(
      `/marketplace/my-listing/requests/${requestId}/accept`,
      responseNote ? { response_note: responseNote } : {},
    );
  },

  async rejectRequest(
    requestId: string,
    responseNote?: string,
  ): Promise<ApiResponse<MarketplaceRequest>> {
    return await apiClient.patch<MarketplaceRequest>(
      `/marketplace/my-listing/requests/${requestId}/reject`,
      responseNote ? { response_note: responseNote } : {},
    );
  },

  // ─── Organization Listing Management ───

  async createOrgListing(
    organizationId: string,
    data: CreateListingRequest,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.post<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing`,
      data,
    );
  },

  async getOrgListing(
    organizationId: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.get<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing`,
    );
  },

  async updateOrgListing(
    organizationId: string,
    data: UpdateListingRequest,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing`,
      data,
    );
  },

  async publishOrgListing(
    organizationId: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/publish`,
    );
  },

  async unpublishOrgListing(
    organizationId: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/unpublish`,
    );
  },

  async getOrgListingRequests(
    organizationId: string,
  ): Promise<ApiResponse<MarketplaceRequest[]>> {
    return await apiClient.get<MarketplaceRequest[]>(
      `/marketplace/organizations/${organizationId}/listing/requests`,
    );
  },

  async acceptOrgRequest(
    organizationId: string,
    requestId: string,
    responseNote?: string,
  ): Promise<ApiResponse<MarketplaceRequest>> {
    return await apiClient.patch<MarketplaceRequest>(
      `/marketplace/organizations/${organizationId}/listing/requests/${requestId}/accept`,
      responseNote ? { response_note: responseNote } : {},
    );
  },

  async rejectOrgRequest(
    organizationId: string,
    requestId: string,
    responseNote?: string,
  ): Promise<ApiResponse<MarketplaceRequest>> {
    return await apiClient.patch<MarketplaceRequest>(
      `/marketplace/organizations/${organizationId}/listing/requests/${requestId}/reject`,
      responseNote ? { response_note: responseNote } : {},
    );
  },
};
