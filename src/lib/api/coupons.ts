import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Discount codes (api feat/discount-codes-api). Provider-made, provider-only:
 * a code belongs to one workspace and discounts only that workspace's
 * membership plans and session bookings. Money is integer minor units beside
 * its currency; the server prices every code, nothing here computes a total
 * that is sent back.
 */

export enum CouponKind {
  MEMBERSHIP = "membership",
  BOOKING = "booking",
}

export enum CouponDiscountType {
  PERCENT = "percent",
  FIXED = "fixed",
}

export interface CouponAmount {
  currency: string;
  amount_minor: number;
}

export interface Coupon {
  id: string;
  organization_id: string;
  code: string;
  label: string | null;
  discount_type: CouponDiscountType;
  percent_off: number | null;
  amounts_minor: CouponAmount[];
  min_order_minor: CouponAmount[];
  applies_to: CouponKind[];
  expires_at: string | null;
  max_redemptions: number | null;
  max_per_user: number;
  /** Paid uses. */
  used_count: number;
  /** Paid uses plus checkouts in flight: what the cap is tested on. */
  redeemed_count: number;
  is_active: boolean;
  is_expired: boolean;
  created_at: string | null;
}

export interface CreateCouponInput {
  /** Omit to have one generated. */
  code?: string;
  label?: string;
  discount_type: CouponDiscountType;
  percent_off?: number;
  amounts_minor?: CouponAmount[];
  min_order_minor?: CouponAmount[];
  applies_to?: CouponKind[];
  expires_at?: string;
  max_redemptions?: number;
  max_per_user?: number;
}

export interface CouponRedemption {
  id: string;
  kind: CouponKind;
  member_name: string;
  currency: string;
  original_amount_minor: number;
  discount_minor: number;
  final_amount_minor: number;
  consumed_at: string | null;
}

/** What a code does to one purchase (POST .../validate-code). Redeems nothing. */
export interface CouponQuote {
  coupon_id: string;
  code: string;
  kind: CouponKind;
  currency: string;
  original_amount_minor: number;
  discount_minor: number;
  final_amount_minor: number;
  /** The buyer pays nothing; the purchase completes without a payment. */
  free: boolean;
  /** The gateway minimum reduced the discount. */
  floored: boolean;
  discount_type: CouponDiscountType;
  percent_off?: number;
}

const base = (orgId: string) => `/coupons/organizations/${encodeURIComponent(orgId)}`;

export const couponsService = {
  // ── Provider (organization owner) ─────────────────────────────────────
  list(orgId: string): Promise<ApiResponse<Coupon[]>> {
    return apiClient.get(base(orgId));
  },
  create(orgId: string, input: CreateCouponInput): Promise<ApiResponse<Coupon>> {
    return apiClient.post(base(orgId), input);
  },
  deactivate(orgId: string, couponId: string): Promise<ApiResponse<Coupon>> {
    return apiClient.post(`${base(orgId)}/${couponId}/deactivate`, {});
  },
  activate(orgId: string, couponId: string): Promise<ApiResponse<Coupon>> {
    return apiClient.post(`${base(orgId)}/${couponId}/activate`, {});
  },
  redemptions(orgId: string, couponId: string): Promise<ApiResponse<CouponRedemption[]>> {
    return apiClient.get(`${base(orgId)}/${couponId}/redemptions`);
  },

  // ── Member ("Have a code?") ───────────────────────────────────────────
  validatePlanCode(listingId: string, planId: string, code: string): Promise<ApiResponse<CouponQuote>> {
    return apiClient.post(
      `/marketplace/listings/${encodeURIComponent(listingId)}/plans/${encodeURIComponent(planId)}/validate-code`,
      { code },
    );
  },
  validateBookingCode(input: {
    providerId: string;
    consultationTypeId: string;
    code: string;
  }): Promise<ApiResponse<CouponQuote>> {
    return apiClient.post("/consultations/bookings/validate-code", input);
  },
};
