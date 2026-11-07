import { formatMinor } from "@/lib/currencies/helpers";
import { CouponDiscountType, CouponKind, type Coupon } from "@/lib/api/coupons";
import type { ApiResponse } from "@/lib/types";

/** Every error the discount-code routes answer with, in words a person can act on. */
const MESSAGES: Record<string, string> = {
  COUPON_INVALID: "This code isn't valid.",
  COUPON_EXPIRED: "This code has expired.",
  COUPON_EXHAUSTED: "This code has been fully used.",
  COUPON_ALREADY_USED: "You've already used this code.",
  COUPON_BELOW_MINIMUM: "This purchase is below the minimum for this code.",
  COUPON_CURRENCY_UNSUPPORTED: "This code can't be used for this price.",
  COUPON_NO_DISCOUNT: "This code doesn't lower this price.",
  COUPON_RENEWAL_NOT_FREE: "A code can't make a renewal free.",
  AUTO_RENEW_NOT_AVAILABLE:
    "Automatic renewal can't be set up on a discounted payment. Turn it on from your membership afterwards.",
  RATE_LIMITED: "Too many tries. Wait a minute and try again.",
};

export function couponErrorMessage(
  res: Pick<ApiResponse<unknown>, "code" | "message" | "status" | "details">,
): string {
  if (res.code === "COUPON_BELOW_MINIMUM" && res.details && typeof res.details.minimum_minor === "number") {
    const cur = typeof res.details.currency === "string" ? res.details.currency : null;
    if (cur) return `This code needs a purchase of at least ${formatMinor(cur, res.details.minimum_minor)}.`;
  }
  if (res.code && MESSAGES[res.code]) return MESSAGES[res.code];
  if (res.status === 429) return MESSAGES.RATE_LIMITED;
  return res.message || "We couldn't check that code. Try again.";
}

/** "10% off", "NGN 5,000 off, or 10 USD off". */
export function discountLabel(c: Pick<Coupon, "discount_type" | "percent_off" | "amounts_minor">): string {
  if (c.discount_type === CouponDiscountType.PERCENT) return `${c.percent_off ?? 0}% off`;
  return `${c.amounts_minor.map((a) => formatMinor(a.currency, a.amount_minor)).join(" or ")} off`;
}

export const APPLIES_LABEL: Record<CouponKind, string> = {
  [CouponKind.MEMBERSHIP]: "Memberships",
  [CouponKind.BOOKING]: "Sessions",
};

export type CouponState = "active" | "inactive" | "expired" | "used_up";

export function couponState(c: Pick<Coupon, "is_active" | "is_expired" | "max_redemptions" | "used_count" | "redeemed_count">): CouponState {
  if (!c.is_active) return "inactive";
  if (c.is_expired) return "expired";
  if (c.max_redemptions !== null && c.redeemed_count >= c.max_redemptions) return "used_up";
  return "active";
}

export const COUPON_STATE_LABEL: Record<CouponState, string> = {
  active: "Active",
  inactive: "Off",
  expired: "Expired",
  used_up: "Fully used",
};

/** 3-20 letters and digits, the API's rule. Empty is fine (one is generated). */
export function isValidCodeText(code: string): boolean {
  return code === "" || /^[A-Za-z0-9]{3,20}$/.test(code);
}
