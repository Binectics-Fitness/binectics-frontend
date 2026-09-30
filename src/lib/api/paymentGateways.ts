/**
 * GET /payment-gateways: the gateways the platform has a working integration
 * for, whether a provider may connect their own account for each, and the
 * currencies each can charge right now. Provider payment settings and the
 * onboarding payout step offer only what this returns.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export interface PublicPaymentGateway {
  /** Gateway id, e.g. "paystack". */
  gateway: string;
  /** Display name, e.g. "Paystack". */
  label: string;
  /** Whether a provider may save their own keys for it. */
  provider_keys_supported: boolean;
  /** ISO 4217 codes it can charge for the platform right now. */
  currencies: string[];
}

/** Refusal code when a provider tries to connect a gateway we can't run for them. */
export const GATEWAY_NOT_SUPPORTED = "GATEWAY_NOT_SUPPORTED";

/** The whole response, made safe to render; rows without an id are dropped. */
export function normalizePaymentGateways(raw: unknown): PublicPaymentGateway[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicPaymentGateway[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.gateway === "string" ? r.gateway.trim().toLowerCase() : "";
    if (!id || out.some((g) => g.gateway === id)) continue;
    out.push({
      gateway: id,
      label:
        typeof r.label === "string" && r.label.trim()
          ? r.label.trim()
          : id.charAt(0).toUpperCase() + id.slice(1),
      provider_keys_supported: r.provider_keys_supported === true,
      currencies: Array.isArray(r.currencies)
        ? r.currencies
            .filter((c): c is string => typeof c === "string")
            .map((c) => c.trim().toUpperCase())
            .filter((c) => /^[A-Z]{3}$/.test(c))
        : [],
    });
  }
  return out;
}

export const paymentGatewaysService = {
  async list(): Promise<ApiResponse<PublicPaymentGateway[]>> {
    const res = await apiClient.get<unknown>("/payment-gateways", false);
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: normalizePaymentGateways(res.data) };
  },
};
