/**
 * Marketplace API Service
 * Handles public listing search, client requests, reviews,
 * and professional listing management.
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  AmenityKey,
  FacilityCategory,
  FacilityCondition,
  FacilityItem,
  FacilityStatus,
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
  contact_phone?: string;
  contact_email?: string;
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
  contact_phone?: string;
  contact_email?: string;
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
  payment_proof_url?: string;
  first_name?: string;
  last_name?: string;
  send_invite?: boolean;
}

export interface EnrollMemberResponse {
  subscription: MembershipSubscription;
  user_created: boolean;
}

// ==================== FEATURED ====================

export interface FeaturedListingItem {
  listing: Pick<
    MarketplaceListing,
    | "_id"
    | "account_type"
    | "headline"
    | "bio"
    | "specialties"
    | "certifications"
    | "photos"
    | "profile_image"
    | "city"
    | "country_code"
    | "currency"
    | "price_from"
    | "price_label"
    | "verification_badge"
    | "average_rating"
    | "review_count"
    | "published_at"
  >;
  plan: Pick<
    MarketplaceMembershipPlan,
    | "_id"
    | "listing_id"
    | "name"
    | "description"
    | "plan_type"
    | "duration_days"
    | "price"
    | "currency"
    | "features"
  > | null;
}

export interface FeaturedListingsResult {
  country: string | null;
  limit: number;
  categories: {
    gym_owner: FeaturedListingItem[];
    personal_trainer: FeaturedListingItem[];
    dietitian: FeaturedListingItem[];
  };
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

  async getFeatured(
    params: { country?: string; limit?: number } = {},
  ): Promise<ApiResponse<FeaturedListingsResult>> {
    const query = new URLSearchParams();
    if (params.country) query.append("country", params.country);
    if (params.limit) query.append("limit", String(params.limit));
    const qs = query.toString();
    return await apiClient.get<FeaturedListingsResult>(
      `/marketplace/featured${qs ? `?${qs}` : ""}`,
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
    paymentReference?: string,
    amountPaid?: number,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.post<MembershipSubscription>(
      `/marketplace/listings/${listingId}/subscribe`,
      {
        plan_id: planId,
        ...(paymentReference && { payment_reference: paymentReference }),
        ...(amountPaid !== undefined && { amount_paid: amountPaid }),
      },
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

  async toggleAutoRenew(
    subscriptionId: string,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.patch<MembershipSubscription>(
      `/marketplace/my-subscriptions/${subscriptionId}/auto-renew`,
      {},
    );
  },

  async getOrgMembershipSubscriptions(
    organizationId: string,
  ): Promise<ApiResponse<MembershipSubscription[]>> {
    return await apiClient.get<MembershipSubscription[]>(
      `/marketplace/organizations/${organizationId}/subscriptions`,
    );
  },

  async getOrgMembershipSubscriptionById(
    organizationId: string,
    subscriptionId: string,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.get<MembershipSubscription>(
      `/marketplace/organizations/${organizationId}/subscriptions/${subscriptionId}`,
    );
  },

  async enrollMember(
    organizationId: string,
    data: EnrollMemberRequest,
  ): Promise<ApiResponse<EnrollMemberResponse>> {
    return await apiClient.post<EnrollMemberResponse>(
      `/marketplace/organizations/${organizationId}/subscriptions/enroll`,
      data,
    );
  },

  async markSubscriptionPaid(
    organizationId: string,
    subscriptionId: string,
    data: { payment_reference?: string; payment_proof_url?: string } = {},
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.patch<MembershipSubscription>(
      `/marketplace/organizations/${organizationId}/subscriptions/${subscriptionId}/mark-paid`,
      data,
    );
  },

  // ==================== PAYMENT CONFIGURATION ====================

  async getPaymentConfigs(
    organizationId: string,
  ): Promise<
    ApiResponse<
      Array<{ gateway: string; public_key: string; is_active: boolean }>
    >
  > {
    return await apiClient.get(
      `/marketplace/organizations/${organizationId}/payment-config`,
    );
  },

  async upsertPaymentConfig(
    organizationId: string,
    data: {
      gateway: string;
      public_key: string;
      secret_key: string;
      is_active?: boolean;
    },
  ): Promise<
    ApiResponse<{ gateway: string; public_key: string; is_active: boolean }>
  > {
    return await apiClient.post(
      `/marketplace/organizations/${organizationId}/payment-config`,
      data,
    );
  },

  async deletePaymentConfig(
    organizationId: string,
    gateway: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete(
      `/marketplace/organizations/${organizationId}/payment-config/${gateway}`,
    );
  },

  async getListingPaymentConfig(
    listingId: string,
  ): Promise<ApiResponse<{ paystack_public_key: string | null }>> {
    return await apiClient.get(
      `/marketplace/listings/${listingId}/payment-config`,
    );
  },

  // ==================== MY LISTINGS (multi-location) ====================

  async getMyListings(): Promise<ApiResponse<MarketplaceListing[]>> {
    return await apiClient.get(`/marketplace/my-listings`);
  },

  async getMyListingFacilityItems(
    listingId: string,
  ): Promise<ApiResponse<FacilityItem[]>> {
    return await apiClient.get(
      `/marketplace/my-listings/${listingId}/facility-items`,
    );
  },

  async addMyListingFacilityItem(
    listingId: string,
    payload: {
      name: string;
      category: FacilityCategory;
      condition: FacilityCondition;
      status?: FacilityStatus;
      description?: string;
      icon_key?: string;
      gradient?: string;
      is_featured?: boolean;
      image?: File;
    },
  ): Promise<ApiResponse<FacilityItem>> {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("category", payload.category);
    formData.append("condition", payload.condition);
    if (payload.status) formData.append("status", payload.status);
    if (payload.description != null)
      formData.append("description", payload.description);
    if (payload.icon_key) formData.append("icon_key", payload.icon_key);
    if (payload.gradient) formData.append("gradient", payload.gradient);
    if (payload.is_featured != null)
      formData.append("is_featured", String(payload.is_featured));
    if (payload.image) formData.append("image", payload.image);

    return await apiClient.postFormData<FacilityItem>(
      `/marketplace/my-listings/${listingId}/facility-items`,
      formData,
    );
  },

  async updateMyListingFacilityItem(
    listingId: string,
    itemId: string,
    payload: {
      name?: string;
      category?: FacilityCategory;
      condition?: FacilityCondition;
      status?: FacilityStatus;
      description?: string;
      icon_key?: string;
      gradient?: string;
      is_featured?: boolean;
      image?: File;
    },
  ): Promise<ApiResponse<FacilityItem>> {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append("name", payload.name);
    if (payload.category !== undefined)
      formData.append("category", payload.category);
    if (payload.condition !== undefined)
      formData.append("condition", payload.condition);
    if (payload.status !== undefined) formData.append("status", payload.status);
    if (payload.description !== undefined)
      formData.append("description", payload.description);
    if (payload.icon_key !== undefined)
      formData.append("icon_key", payload.icon_key);
    if (payload.gradient !== undefined)
      formData.append("gradient", payload.gradient);
    if (payload.is_featured !== undefined)
      formData.append("is_featured", String(payload.is_featured));
    if (payload.image) formData.append("image", payload.image);

    return await apiClient.patchFormData<FacilityItem>(
      `/marketplace/my-listings/${listingId}/facility-items/${itemId}`,
      formData,
    );
  },

  async deleteMyListingFacilityItem(
    listingId: string,
    itemId: string,
  ): Promise<ApiResponse<{ deleted: true }>> {
    return await apiClient.delete(
      `/marketplace/my-listings/${listingId}/facility-items/${itemId}`,
    );
  },

  async updateMyListingAmenities(
    listingId: string,
    amenities: AmenityKey[],
  ): Promise<ApiResponse<{ amenities: AmenityKey[] }>> {
    return await apiClient.patch(
      `/marketplace/my-listings/${listingId}/amenities`,
      { amenities },
    );
  },
};
