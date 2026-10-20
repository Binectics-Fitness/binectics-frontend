/**
 * The workspace's payout bank account (owner ruling, Oct 20 2026).
 *
 * Every route is the workspace owner's only (403 ORG_OWNER_ONLY for anyone
 * else), reads included. The account is checked with Paystack's account
 * resolve before it is saved: the name shown is always Paystack's, never one
 * the owner typed, and the API never returns the full number again (only
 * the last four digits). Saving an account sends no money: payouts wait on
 * KYC verification (Oct 4 ruling).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

const base = (organizationId: string) =>
  `/marketplace/organizations/${encodeURIComponent(organizationId)}/payout-account`;

/** A bank Paystack can pay to in the workspace's currency. */
export interface PayoutBank {
  code: string;
  name: string;
}

export interface PayoutBankList {
  currency: string;
  banks: PayoutBank[];
}

/** What Paystack says an account number at a bank is. Nothing is stored. */
export interface ResolvedPayoutAccount {
  bank_code: string;
  bank_name: string;
  account_name: string;
  account_last4: string;
  /** e.g. "******6789" */
  account_number_masked: string;
  currency: string;
}

/** The saved account, as the API shows it: never the full number. */
export interface PayoutAccountView extends ResolvedPayoutAccount {
  verified: true;
  verified_at: string;
  updated_at: string | null;
}

export interface PayoutAccountStatus {
  account: PayoutAccountView | null;
  /** False until payouts run (and, for a workspace, until KYC passes). */
  payouts_enabled: boolean;
  payouts_blocked_reason: "kyc_required" | null;
}

/** What resolve and save take. Never an account name: the name is Paystack's. */
export interface PayoutAccountInput {
  bank_code: string;
  /** Digits only, 6 to 20 of them. */
  account_number: string;
  currency?: string;
}

export const payoutAccountService = {
  getStatus(organizationId: string): Promise<ApiResponse<PayoutAccountStatus>> {
    return apiClient.get(base(organizationId));
  },

  /** Paystack's banks for the workspace's currency (or `currency`). */
  listBanks(organizationId: string, currency?: string): Promise<ApiResponse<PayoutBankList>> {
    const q = currency ? `?currency=${encodeURIComponent(currency)}` : "";
    return apiClient.get(`${base(organizationId)}/banks${q}`);
  },

  /** Looks the account up at Paystack. Stores nothing. Throttled: 10 a minute. */
  resolve(organizationId: string, input: PayoutAccountInput): Promise<ApiResponse<ResolvedPayoutAccount>> {
    return apiClient.post(`${base(organizationId)}/resolve`, pick(input));
  },

  /** Resolves again on the server and saves, replacing any account. Throttled: 5 a minute. */
  save(organizationId: string, input: PayoutAccountInput): Promise<ApiResponse<PayoutAccountStatus>> {
    return apiClient.put(base(organizationId), pick(input));
  },

  remove(organizationId: string): Promise<ApiResponse<{ removed: boolean }>> {
    return apiClient.delete(base(organizationId));
  },
};

/**
 * Only the fields the API takes: it refuses unknown ones (400), and an
 * account name must never reach it.
 */
function pick(input: PayoutAccountInput): PayoutAccountInput {
  return {
    bank_code: input.bank_code,
    account_number: input.account_number,
    ...(input.currency ? { currency: input.currency } : {}),
  };
}

/** Plain words for the payout-account API's refusals. */
export function payoutAccountErrorMessage(res: Pick<ApiResponse, "code" | "status" | "message">): string {
  switch (res.code) {
    case "PAYOUT_ACCOUNT_NOT_RESOLVED":
      return res.message || "Paystack couldn't find that account number at that bank. Check both and try again.";
    case "PAYOUT_BANK_LOOKUP_UNAVAILABLE":
      return "We couldn't reach Paystack to check the account. Try again in a minute.";
    case "PAYOUT_BANK_UNKNOWN":
      return "Paystack can't pay to that bank. Choose another bank.";
    case "ORG_OWNER_ONLY":
      return "Only the workspace's owner can manage its payout account.";
  }
  if (res.status === 429) return "Too many checks in a row. Wait a minute, then try again.";
  if (res.status === 502) return "We couldn't reach Paystack to check the account. Try again in a minute.";
  // 400: the workspace has no currency (the message says to set it in
  // Settings) or a validation failure; the API's words say which.
  return res.message || "Something went wrong. Try again.";
}

/**
 * Whether an account number is complete enough to look up on its own: a
 * 10-digit NUBAN for NGN. Other currencies' numbers vary in length, so they
 * are looked up on blur or with "Check account".
 */
export function isCompleteAccountNumber(accountNumber: string, currency: string | undefined): boolean {
  return currency === "NGN" && /^\d{10}$/.test(accountNumber);
}

/** The API's accepted shape: 6 to 20 digits. */
export function isValidAccountNumber(accountNumber: string): boolean {
  return /^\d{6,20}$/.test(accountNumber);
}
