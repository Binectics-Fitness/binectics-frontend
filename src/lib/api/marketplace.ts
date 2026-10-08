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

// ==================== PAYMENT CONFIGURATION TYPES ====================

/**
 * A currency verified on the org's OWN gateway account (Paystack: listed by
 * GET /balance on their key), so membership plans may be priced in it even
 * when the platform can't take it. Never trusted from the provider's word.
 */
export interface ProviderAccountCurrency {
  code: string;
  /** ISO timestamp of the last successful check. */
  verified_at: string;
  /** How it was checked, e.g. "paystack_balance". */
  verified_via: string;
}

/** GET .../payment-config row. The secret key never leaves the API. */
export interface OrgPaymentConfig {
  gateway: string;
  public_key: string;
  is_active: boolean;
  currencies: ProviderAccountCurrency[];
}

/** POST/DELETE .../payment-config/:gateway/currencies response. */
export interface ProviderCurrenciesResult {
  gateway: string;
  currencies: ProviderAccountCurrency[];
}

/** POST .../payment-config/:gateway/currencies/refresh response. */
export interface ProviderCurrenciesRefreshResult extends ProviderCurrenciesResult {
  /** Dropped: no longer on the account and nothing depended on them. */
  removed: string[];
  /** Kept because plans or payments depend on them, but gone from the account. */
  missing_on_account: string[];
}

/** 409 CURRENCY_LOCKED `locked_by`, per currency code. */
export type ProviderCurrencyLocks = Record<string, { live_plans: number; pending_payments: number }>;

function normalizeProviderCurrencies(raw: unknown): ProviderAccountCurrency[] {
  if (!Array.isArray(raw)) return [];
  const out: ProviderAccountCurrency[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const code = typeof r.code === "string" ? r.code.trim().toUpperCase() : "";
    if (!/^[A-Z]{3}$/.test(code) || out.some((c) => c.code === code)) continue;
    out.push({
      code,
      verified_at: typeof r.verified_at === "string" ? r.verified_at : "",
      verified_via: typeof r.verified_via === "string" ? r.verified_via : "",
    });
  }
  return out;
}

/** A payment-config row made safe; an older API without `currencies` reads as none. */
export function normalizePaymentConfig(raw: unknown): OrgPaymentConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const gateway = typeof r.gateway === "string" ? r.gateway.trim().toLowerCase() : "";
  if (!gateway) return null;
  return {
    gateway,
    public_key: typeof r.public_key === "string" ? r.public_key : "",
    is_active: r.is_active === true,
    currencies: normalizeProviderCurrencies(r.currencies),
  };
}

function normalizeCurrenciesResult(raw: unknown, gateway: string): ProviderCurrenciesRefreshResult {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const codes = (v: unknown) =>
    Array.isArray(v) ? v.filter((c): c is string => typeof c === "string").map((c) => c.toUpperCase()) : [];
  return {
    gateway: typeof r.gateway === "string" ? r.gateway : gateway,
    currencies: normalizeProviderCurrencies(r.currencies),
    removed: codes(r.removed),
    missing_on_account: codes(r.missing_on_account),
  };
}

/** The `locked_by` a CURRENCY_LOCKED refusal carries, if any. */
export function providerCurrencyLocks(res: Pick<ApiResponse<unknown>, "details">): ProviderCurrencyLocks {
  const raw = res.details?.locked_by;
  if (!raw || typeof raw !== "object") return {};
  const out: ProviderCurrencyLocks = {};
  for (const [code, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const l = v as Record<string, unknown>;
    out[code.toUpperCase()] = {
      live_plans: typeof l.live_plans === "number" ? l.live_plans : 0,
      pending_payments: typeof l.pending_payments === "number" ? l.pending_payments : 0,
    };
  }
  return out;
}

// ==================== REQUEST TYPES ====================

/** POST /marketplace/listings/:id/plans/:planId/checkout. */
export interface PlanCheckout {
  reference: string;
  /** What subscribe expects as `payment_reference` ("paystack_<reference>"). */
  payment_reference: string;
  access_code: string;
  authorization_url: string | null;
  amount_minor: number;
  currency: string;
  plan_id: string;
}

/**
 * A listing's currency is the API's to derive (from the provider's own
 * prices, else the organization's currency); it ignores one sent. Strip any
 * `currency` a caller spreads in, so a listing write never claims one.
 */
export function withoutListingCurrency<T extends object>(data: T): Omit<T, "currency"> {
  const { currency: _dropped, ...rest } = data as T & { currency?: unknown };
  void _dropped;
  return rest;
}

/** POST body for a new listing. There is no `currency`: the API derives it. */
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
  /** Minor units (kobo/cents) — see MarketplaceListing.price_from_minor. */
  price_from_minor?: number;
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
  /** Minor units (kobo/cents) — see MarketplaceListing.price_from_minor. */
  price_from_minor?: number;
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
  /** Minor units (kobo/cents). ₦5,000 is 500000, not 5000. */
  price_minor: number;
  currency?: string;
  features?: string[];
  is_active?: boolean;
  is_public?: boolean;
}

export type UpdateOrgMembershipPlanRequest =
  Partial<CreateOrgMembershipPlanRequest>;

/**
 * How the enrolment is paid. Either way the gym only sends an offer: nothing
 * is created until the member accepts it.
 * - "manual": money taken off-platform; the subscription starts with the
 *   requested status once the member accepts.
 * - "paystack_transfer": when the member accepts, a one-time Paystack transfer
 *   account is opened for the plan price and returned to the MEMBER (not the
 *   gym). The subscription stays pending until the webhook confirms it.
 */
export type EnrollPaymentMode = "manual" | "paystack_transfer";

export interface EnrollMemberRequest {
  email: string;
  plan_id: string;
  payment_mode?: EnrollPaymentMode;
  status?: "active" | "pending_payment";
  /** Minor units (kobo/cents). Defaults to the plan price; 0 comps the member. */
  amount_paid_minor?: number;
  payment_reference?: string;
  payment_proof_url?: string;
  first_name?: string;
  last_name?: string;
  /** @deprecated Ignored by the API: the member is always emailed the offer. */
  send_invite?: boolean;
}

/** The one-time bank account a member transfers into (Paystack "Pay with Transfer"). */
export interface EnrollTransferAccount {
  account_number: string;
  account_name?: string;
  bank_name?: string;
  /** ISO timestamp after which the account stops accepting the transfer. */
  expires_at?: string | null;
  /** Amount to transfer, in minor units. */
  amount_minor: number;
  currency: string;
  reference: string;
}

export type EnrollmentOfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

/** What the gym gets back after enrolling: the offer, never the member's data. */
export interface EnrollmentOfferSummary {
  _id: string;
  email: string;
  plan_id: string;
  status: EnrollmentOfferStatus;
  expires_at: string;
}

/**
 * Enrolling no longer creates a subscription or an account: it records an
 * offer the member accepts. The response is the same for every email, so it
 * cannot be used to probe who has an account.
 */
export interface EnrollMemberResponse {
  /** Always null now; the subscription is created when the member accepts. */
  subscription: MembershipSubscription | null;
  /** Always false now; no account is ever created for someone else. */
  user_created: boolean;
  pending_acceptance?: boolean;
  enrollment_offer?: EnrollmentOfferSummary;
  /**
   * @deprecated No longer returned to the gym: for a transfer offer the
   * account is opened when the member accepts and is shown to them.
   */
  transfer_account?: EnrollTransferAccount;
}

/** A pending membership offer, as the member sees it. */
export interface EnrollmentOffer {
  _id: string;
  /** Null if the gym's workspace was deleted after the offer was made. */
  organization_id: { _id: string; name: string; logo_url?: string | null } | null;
  /** Null if the plan was deleted after the offer was made. */
  plan_id: {
    _id: string;
    name: string;
    /** Minor units (kobo/cents). */
    price_minor: number;
    currency: string;
    duration_days: number;
  } | null;
  email: string;
  requested_status: "active" | "pending_payment";
  payment_mode: EnrollPaymentMode;
  /** Minor units (kobo/cents). */
  amount_paid_minor?: number | null;
  payment_reference?: string | null;
  expires_at: string;
  created_at: string;
  status: EnrollmentOfferStatus;
}

export interface AcceptEnrollmentOfferResult {
  subscription: MembershipSubscription;
  /** Present for a "paystack_transfer" offer: where the member pays. */
  transfer_account?: EnrollTransferAccount;
}

/** A pending offer as the gym sees it (plan populated). */
export interface OrgEnrollmentOffer {
  _id: string;
  email: string;
  plan_id:
    | { _id: string; name: string; price_minor: number; currency: string; duration_days?: number }
    | string
    | null;
  payment_mode: EnrollPaymentMode;
  status: EnrollmentOfferStatus;
  expires_at: string;
  created_at: string;
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
    | "price_from_minor"
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
    | "price_minor"
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

// ==================== SAVED PROVIDERS ====================
//
// Hand-written until the API PR (feat/saved-providers) merges and the
// generated schema catches up. Contract: /marketplace/saved, signed in.

/** A saved listing: the same card fields Explore returns, plus when it was saved. */
export type SavedListingCard = MarketplaceListing & {
  organization?: { _id: string; name: string; logo?: string } | null;
  professional?: { _id: string; first_name: string; last_name: string; profile_picture?: string } | null;
  saved_at: string;
};

export interface SavedListingState {
  listing_id: string;
  saved: boolean;
  saved_at?: string;
}

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

  // Saved providers. Any role; the API caps a user at 500.

  /** The user's saved listings, newest first; unpublished/suspended ones are left out. */
  async getSavedListings(): Promise<ApiResponse<SavedListingCard[]>> {
    return await apiClient.get<SavedListingCard[]>("/marketplace/saved");
  },

  /** Just the ids of every saved listing, for showing saved state on cards. */
  async getSavedListingIds(): Promise<ApiResponse<string[]>> {
    return await apiClient.get<string[]>("/marketplace/saved/ids");
  },

  /** Idempotent: saving an already-saved listing succeeds. */
  async saveListing(listingId: string): Promise<ApiResponse<SavedListingState>> {
    return await apiClient.put<SavedListingState>(
      `/marketplace/saved/${encodeURIComponent(listingId)}`,
    );
  },

  async unsaveListing(listingId: string): Promise<ApiResponse<SavedListingState>> {
    return await apiClient.delete<SavedListingState>(
      `/marketplace/saved/${encodeURIComponent(listingId)}`,
    );
  },


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
      withoutListingCurrency(data),
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
      withoutListingCurrency(data),
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

  /**
   * Accepts a connection request. The API answers with the client profile
   * it created (or the one that already existed), not the request.
   */
  async acceptRequest(
    requestId: string,
    responseNote?: string,
  ): Promise<ApiResponse<{ _id: string }>> {
    return await apiClient.patch<{ _id: string }>(
      `/marketplace/my-listing/requests/${requestId}/accept`,
      responseNote ? { response_note: responseNote } : {},
    );
  },

  /** Declines a request. The API returns no data, only a message. */
  async rejectRequest(
    requestId: string,
    responseNote?: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.patch<void>(
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
      withoutListingCurrency(data),
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
      withoutListingCurrency(data),
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

  // ── Solo listing gallery (trainer / dietitian) ──────────────────────
  // Same shape as the org gallery methods above, but keyed by the owner's
  // listing id (marketplace-api #119). A solo listing has no organization.

  async uploadSoloListingGalleryImages(
    listingId: string,
    files: File[],
  ): Promise<ApiResponse<MarketplaceListing>> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return await apiClient.postFormData<MarketplaceListing>(
      `/marketplace/my-listings/${listingId}/gallery`,
      formData,
    );
  },

  async deleteSoloListingGalleryImage(
    listingId: string,
    imageUrl: string,
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/my-listings/${listingId}/gallery/delete`,
      { image_url: imageUrl },
    );
  },

  async reorderSoloListingGalleryImages(
    listingId: string,
    photos: string[],
  ): Promise<ApiResponse<MarketplaceListing>> {
    return await apiClient.patch<MarketplaceListing>(
      `/marketplace/my-listings/${listingId}/gallery/reorder`,
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

  /**
   * Start paying for a paid plan. The API initialises the Paystack
   * transaction for the plan's own price and currency (with the gym's own
   * key when it has one) and returns what the browser opens. Once paid, the
   * member subscribes with `payment_reference` through
   * subscribeToListingPlan. The API refuses a currency it can't charge.
   */
  async startPlanCheckout(
    listingId: string,
    planId: string,
  ): Promise<ApiResponse<PlanCheckout>> {
    return await apiClient.post<PlanCheckout>(
      `/marketplace/listings/${listingId}/plans/${planId}/checkout`,
      {},
    );
  },

  /**
   * @param amountPaidMinor What was charged, in the currency's MINOR unit
   *   (kobo/cents) — the same unit as `plan.price_minor`, which the API
   *   compares it against. Passing a major-unit amount here would record a
   *   payment 100× too small and the API's `forbidNonWhitelisted` would
   *   reject the old `amount_paid` key outright.
   */
  async subscribeToListingPlan(
    listingId: string,
    planId: string,
    paymentReference?: string,
    amountPaidMinor?: number,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.post<MembershipSubscription>(
      `/marketplace/listings/${listingId}/subscribe`,
      {
        plan_id: planId,
        ...(paymentReference && { payment_reference: paymentReference }),
        ...(amountPaidMinor !== undefined && {
          amount_paid_minor: amountPaidMinor,
        }),
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

  /** Assign a gym member to one of the gym's trainers, move them, or unassign (null). */
  async assignMemberTrainer(
    organizationId: string,
    subscriptionId: string,
    staffUserId: string | null,
  ): Promise<ApiResponse<{ assigned_staff_user_id: string | null }>> {
    return await apiClient.put<{ assigned_staff_user_id: string | null }>(
      `/marketplace/organizations/${organizationId}/subscriptions/${subscriptionId}/assignee`,
      { staff_user_id: staffUserId },
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

  /** Pending offers the gym has sent (plan populated). */
  async getOrgEnrollmentOffers(
    organizationId: string,
  ): Promise<ApiResponse<OrgEnrollmentOffer[]>> {
    return await apiClient.get<OrgEnrollmentOffer[]>(
      `/marketplace/organizations/${organizationId}/enrollment-offers`,
    );
  },

  /** Withdraw a pending offer. 204 on success. */
  async cancelOrgEnrollmentOffer(
    organizationId: string,
    offerId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(
      `/marketplace/organizations/${organizationId}/enrollment-offers/${offerId}/cancel`,
    );
  },

  /** Membership offers addressed to me. Empty until my email is verified. */
  async getMyEnrollmentOffers(): Promise<ApiResponse<EnrollmentOffer[]>> {
    return await apiClient.get<EnrollmentOffer[]>(
      "/marketplace/enrollment-offers/mine",
    );
  },

  async acceptEnrollmentOffer(
    offerId: string,
  ): Promise<ApiResponse<AcceptEnrollmentOfferResult>> {
    return await apiClient.post<AcceptEnrollmentOfferResult>(
      `/marketplace/enrollment-offers/${offerId}/accept`,
    );
  },

  async declineEnrollmentOffer(
    offerId: string,
  ): Promise<ApiResponse<{ declined: true }>> {
    return await apiClient.post<{ declined: true }>(
      `/marketplace/enrollment-offers/${offerId}/decline`,
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

  /** Re-send the welcome / set-your-password email to an enrolled member. */
  async resendMemberInvite(
    organizationId: string,
    subscriptionId: string,
  ): Promise<ApiResponse<null>> {
    return await apiClient.post<null>(
      `/marketplace/organizations/${organizationId}/subscriptions/${subscriptionId}/resend-invite`,
    );
  },

  /**
   * Schedule (plan_id) or clear (null) a plan change applied at the end of
   * the current period. Scheduling turns auto-renew on.
   */
  async setSubscriptionNextPlan(
    organizationId: string,
    subscriptionId: string,
    planId: string | null,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.patch<MembershipSubscription>(
      `/marketplace/organizations/${organizationId}/subscriptions/${subscriptionId}/next-plan`,
      { plan_id: planId },
    );
  },

  /** Org-side cancellation of a membership subscription. */
  async cancelOrgSubscription(
    organizationId: string,
    subscriptionId: string,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return await apiClient.patch<MembershipSubscription>(
      `/marketplace/organizations/${organizationId}/subscriptions/${subscriptionId}/cancel`,
    );
  },

  /**
   * Archive a member to free their seat. Billing-only — the member keeps their
   * account and data. Refused by the API while a live subscription still
   * entitles them, so it can't quietly stop the org paying for someone still
   * training. Keyed on the member, not a subscription (a seat is a person).
   */
  async archiveMember(
    organizationId: string,
    memberUserId: string,
    reason?: string,
  ): Promise<ApiResponse<{ archived: boolean }>> {
    return await apiClient.post<{ archived: boolean }>(
      `/marketplace/organizations/${organizationId}/members/${memberUserId}/archive`,
      reason ? { reason } : {},
    );
  },

  /** Restore an archived member, taking a seat back (subject to the seat quota). */
  async restoreMember(
    organizationId: string,
    memberUserId: string,
  ): Promise<ApiResponse<{ restored: boolean }>> {
    return await apiClient.post<{ restored: boolean }>(
      `/marketplace/organizations/${organizationId}/members/${memberUserId}/restore`,
    );
  },

  // ==================== PAYMENT CONFIGURATION ====================

  async getPaymentConfigs(
    organizationId: string,
  ): Promise<ApiResponse<OrgPaymentConfig[]>> {
    const res = await apiClient.get<unknown>(
      `/marketplace/organizations/${organizationId}/payment-config`,
    );
    if (!res.success) return { ...res, data: undefined };
    const rows = Array.isArray(res.data) ? res.data : [];
    return {
      ...res,
      data: rows
        .map(normalizePaymentConfig)
        .filter((c): c is OrgPaymentConfig => c !== null),
    };
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

  /**
   * Verify `code` on the org's own gateway account and allow membership
   * prices in it. Refusals: 400 PROVIDER_CURRENCY_NOT_ON_ACCOUNT /
   * _UNKNOWN / _UNSUPPORTED / _BLOCKED, PROVIDER_ACCOUNT_MISSING,
   * GATEWAY_NOT_SUPPORTED; 502 PROVIDER_ACCOUNT_CHECK_FAILED.
   */
  async verifyProviderCurrency(
    organizationId: string,
    gateway: string,
    code: string,
  ): Promise<ApiResponse<ProviderCurrenciesResult>> {
    const res = await apiClient.post<unknown>(
      `/marketplace/organizations/${organizationId}/payment-config/${encodeURIComponent(gateway)}/currencies`,
      { code },
    );
    if (!res.success) return { ...res, data: undefined };
    const { currencies } = normalizeCurrenciesResult(res.data, gateway);
    return { ...res, data: { gateway, currencies } };
  },

  /** Remove a verified currency; 409 CURRENCY_LOCKED (details.locked_by) while plans or payments depend on it. */
  async removeProviderCurrency(
    organizationId: string,
    gateway: string,
    code: string,
  ): Promise<ApiResponse<ProviderCurrenciesResult>> {
    const res = await apiClient.delete<unknown>(
      `/marketplace/organizations/${organizationId}/payment-config/${encodeURIComponent(gateway)}/currencies/${encodeURIComponent(code)}`,
    );
    if (!res.success) return { ...res, data: undefined };
    const { currencies } = normalizeCurrenciesResult(res.data, gateway);
    return { ...res, data: { gateway, currencies } };
  },

  /** Re-check every stored currency with the gateway in one call. */
  async refreshProviderCurrencies(
    organizationId: string,
    gateway: string,
  ): Promise<ApiResponse<ProviderCurrenciesRefreshResult>> {
    const res = await apiClient.post<unknown>(
      `/marketplace/organizations/${organizationId}/payment-config/${encodeURIComponent(gateway)}/currencies/refresh`,
    );
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: normalizeCurrenciesResult(res.data, gateway) };
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
