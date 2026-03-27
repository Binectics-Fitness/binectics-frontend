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
  MarketplaceVerificationBadge,
  MarketplaceListingDocument,
  MarketplaceMembershipPlan,
  MembershipPlanType,
  MembershipSubscription,
} from "@/lib/types";

// ==================== REQUEST TYPES ====================

export interface CreateListingRequest {
  account_type: MarketplaceAccountType;
  headline: string;
  bio: string;
  specialties?: string[];
  certifications?: string[];
  languages?: string[];
  facilities?: string[];
  amenities?: string[];
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
  facilities?: string[];
  amenities?: string[];
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

export interface AwardGymBadgeRequest {
  verification_badge: MarketplaceVerificationBadge;
}

export interface SuspendGymRequest {
  reason?: string;
}

export interface CreateOrgMembershipPlanRequest {
  name: string;
  description?: string;
  plan_type: MembershipPlanType;
  duration_days: number;
  price: number;
  currency?: string;
  features?: string[];
  is_active?: boolean;
  is_public?: boolean;
}

export type UpdateOrgMembershipPlanRequest =
  Partial<CreateOrgMembershipPlanRequest>;

export interface EnrollMemberRequest {
  email: string;
  plan_id: string;
  status?: "active" | "pending_payment";
  amount_paid?: number;
  payment_reference?: string;
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

  async getListingById(id: string): Promise<ApiResponse<MarketplaceListing>> {
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
    return await apiClient.delete<void>(`/marketplace/requests/${requestId}`);
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
    return await apiClient.delete<void>(`/marketplace/reviews/${reviewId}`);
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
    return await apiClient.get<MarketplaceListing>("/marketplace/my-listing");
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

  async getMyListingRequests(): Promise<ApiResponse<MarketplaceRequest[]>> {
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

  // ─── Admin Gym Moderation ───

  async getAdminGymListings(): Promise<ApiResponse<MarketplaceListing[]>> {
    return await apiClient.get<MarketplaceListing[]>("/admin/gyms");
  },

  async awardGymBadge(
    listingId: string,
    data: AwardGymBadgeRequest,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/admin/gyms/${listingId}/badge/award`,
      data,
    );
  },

  async revokeGymBadge(
    listingId: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/admin/gyms/${listingId}/badge/revoke`,
    );
  },

  async suspendGym(
    listingId: string,
    data?: SuspendGymRequest,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/admin/gyms/${listingId}/suspend`,
      data ?? {},
    );
  },

  async unsuspendGym(
    listingId: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/admin/gyms/${listingId}/unsuspend`,
    );
  },

  // ─── Membership Plans ───

  async getOrgMembershipPlans(
    organizationId: string,
  ): Promise<ApiResponse<MarketplaceMembershipPlan[]>> {
    return await apiClient.get<MarketplaceMembershipPlan[]>(
      `/marketplace/organizations/${organizationId}/plans`,
    );
  },

  async getOrgMembershipPlanById(
    organizationId: string,
    planId: string,
  ): Promise<ApiResponse<MarketplaceMembershipPlan>> {
    return await apiClient.get<MarketplaceMembershipPlan>(
      `/marketplace/organizations/${organizationId}/plans/${planId}`,
    );
  },

  async createOrgMembershipPlan(
    organizationId: string,
    data: CreateOrgMembershipPlanRequest,
  ): Promise<ApiResponse<MarketplaceMembershipPlan>> {
    return await apiClient.post<MarketplaceMembershipPlan>(
      `/marketplace/organizations/${organizationId}/plans`,
      data,
    );
  },

  async updateOrgMembershipPlan(
    organizationId: string,
    planId: string,
    data: UpdateOrgMembershipPlanRequest,
  ): Promise<ApiResponse<MarketplaceMembershipPlan>> {
    return await apiClient.patch<MarketplaceMembershipPlan>(
      `/marketplace/organizations/${organizationId}/plans/${planId}`,
      data,
    );
  },

  async activateOrgMembershipPlan(
    organizationId: string,
    planId: string,
  ): Promise<ApiResponse<MarketplaceMembershipPlan>> {
    return await apiClient.patch<MarketplaceMembershipPlan>(
      `/marketplace/organizations/${organizationId}/plans/${planId}/activate`,
    );
  },

  async deactivateOrgMembershipPlan(
    organizationId: string,
    planId: string,
  ): Promise<ApiResponse<MarketplaceMembershipPlan>> {
    return await apiClient.patch<MarketplaceMembershipPlan>(
      `/marketplace/organizations/${organizationId}/plans/${planId}/deactivate`,
    );
  },

  async deleteOrgMembershipPlan(
    organizationId: string,
    planId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/marketplace/organizations/${organizationId}/plans/${planId}`,
    );
  },

  async getPublicListingPlans(
    listingId: string,
  ): Promise<ApiResponse<MarketplaceMembershipPlan[]>> {
    return await apiClient.get<MarketplaceMembershipPlan[]>(
      `/marketplace/listings/${listingId}/plans`,
      false,
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

  async uploadOrgListingProfileImage(
    organizationId: string,
    file: File,
  ): Promise<ApiResponse<MarketplaceListing>> {
    const formData = new FormData();
    formData.append("file", file);

    return await apiClient.patchFormData<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/profile-image`,
      formData,
    );
  },

  async deleteOrgListingProfileImage(
    organizationId: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/profile-image/delete`,
    );
  },

  async uploadOrgListingGalleryImages(
    organizationId: string,
    files: File[],
  ): Promise<ApiResponse<MarketplaceListing>> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return await apiClient.postFormData<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/gallery`,
      formData,
    );
  },

  async deleteOrgListingGalleryImage(
    organizationId: string,
    imageUrl: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/gallery/delete`,
      { image_url: imageUrl },
    );
  },

  async replaceOrgListingGalleryImage(
    organizationId: string,
    oldImageUrl: string,
    file: File,
  ): Promise<ApiResponse<MarketplaceListing>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("old_image_url", oldImageUrl);

    return await apiClient.patchFormData<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/gallery/replace`,
      formData,
    );
  },

  async reorderOrgListingGalleryImages(
    organizationId: string,
    photos: string[],
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/organizations/${organizationId}/listing/gallery/reorder`,
      { photos },
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

  async uploadOrgListingDocument(
    organizationId: string,
    file: File,
  ): Promise<ApiResponse<MarketplaceListingDocument>> {
    const formData = new FormData();
    formData.append("file", file);

    return await apiClient.postFormData<MarketplaceListingDocument>(
      `/marketplace/organizations/${organizationId}/listing/documents`,
      formData,
    );
  },

  async getOrgListingDocuments(
    organizationId: string,
  ): Promise<ApiResponse<MarketplaceListingDocument[]>> {
    return await apiClient.get<MarketplaceListingDocument[]>(
      `/marketplace/organizations/${organizationId}/listing/documents`,
    );
  },

  async deleteOrgListingDocument(
    organizationId: string,
    documentId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/marketplace/organizations/${organizationId}/listing/documents/${documentId}`,
    );
  },

  async getAdminGymListingDocuments(
    listingId: string,
  ): Promise<ApiResponse<MarketplaceListingDocument[]>> {
    return await apiClient.get<MarketplaceListingDocument[]>(
      `/admin/gyms/${listingId}/documents`,
    );
  },

  // ─── Membership Subscriptions ───

  async subscribeToListingPlan(
    listingId: string,
    planId: string,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.post<MembershipSubscription>(
      `/marketplace/listings/${listingId}/subscribe`,
      { plan_id: planId },
    );
  },

  async getMyMembershipSubscriptions(): Promise<
    ApiResponse<MembershipSubscription[]>
  > {
    return await apiClient.get<MembershipSubscription[]>(
      "/marketplace/my-subscriptions",
    );
  },

  async cancelMembershipSubscription(
    subscriptionId: string,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.delete<MembershipSubscription>(
      `/marketplace/my-subscriptions/${subscriptionId}`,
    );
  },

  async getOrgMembershipSubscriptions(
    organizationId: string,
  ): Promise<ApiResponse<MembershipSubscription[]>> {
    return await apiClient.get<MembershipSubscription[]>(
      `/marketplace/organizations/${organizationId}/subscriptions`,
    );
  },

  async enrollMember(
    organizationId: string,
    data: EnrollMemberRequest,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.post<MembershipSubscription>(
      `/marketplace/organizations/${organizationId}/subscriptions/enroll`,
      data,
    );
  },
};
