import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { apiClient } from "@/lib/api/client";
import { memberBillingService, AUTO_RENEW_SENDS_DESIRED_STATE } from "@/lib/api/memberBilling";
import { marketplaceService } from "@/lib/api/marketplace";
import CheckoutSuccessPage from "@/app/checkout/success/page";

let query = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(query),
}));
const authState = { user: { id: "u1" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("member billing client", () => {
  it("encodes every id it puts in a path", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ success: true, data: [] });
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ success: true, data: {} });
    const del = vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true, data: {} });
    await memberBillingService.getPlanAutoRenewConsent("a/b", "c?d");
    await memberBillingService.removePaymentMethod("../x");
    await memberBillingService.recordRenewal("o 1", "s#1", { payment_method: "cash" });
    await memberBillingService.listOrgCharges("o/1", "failed_final");
    await marketplaceService.startPlanCheckout("l/1", "p/1");
    expect(get.mock.calls[0][0]).toBe("/marketplace/listings/a%2Fb/plans/c%3Fd/auto-renew-consent");
    expect(del.mock.calls[0][0]).toBe("/marketplace/my-payment-methods/..%2Fx");
    expect(post.mock.calls[0][0]).toBe("/marketplace/organizations/o%201/subscriptions/s%231/record-renewal");
    expect(get.mock.calls[1][0]).toBe("/marketplace/organizations/o%2F1/member-billing/charges?status=failed_final");
    expect(post.mock.calls[1][0]).toBe("/marketplace/listings/l%2F1/plans/p%2F1/checkout");
  });

  it("doesn't send { enabled } until the API takes it, and sends the consent", async () => {
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({ success: true, data: {} as never });
    const echo = { text_version: "v", text_sha256: "h", channel: "web" as const };
    await memberBillingService.setAutoRenew("s1", undefined, false);
    await memberBillingService.setAutoRenew("s1", echo, true);
    expect(AUTO_RENEW_SENDS_DESIRED_STATE).toBe(false);
    expect(patch.mock.calls[0][1]).toEqual({});
    expect(patch.mock.calls[1][1]).toEqual({ consent: echo });
  });
});

describe("checkout success page: why the card wasn't saved", () => {
  beforeEach(() => {
    vi.spyOn(marketplaceService, "getListingById").mockResolvedValue({ success: false } as never);
    vi.spyOn(marketplaceService, "getPublicListingPlans").mockResolvedValue({ success: false } as never);
  });

  it("shows the reason in plain words", async () => {
    query = "listing=l1&plan=p1&renewal=not_saved&reason=terms_mismatch";
    render(<CheckoutSuccessPage />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "The payment didn't match the renewal terms that were agreed, so the card wasn't saved. Auto-renew is off.",
    );
  });

  it("never renders an unknown reason as given", async () => {
    query = "listing=l1&plan=p1&renewal=not_saved&reason=%3Cb%3Ehi%3C%2Fb%3E";
    render(<CheckoutSuccessPage />);
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("We couldn't save this card for renewals.");
    expect(status).not.toHaveTextContent("<b>");
  });

  it("without a reason, says the card wasn't saved", async () => {
    query = "listing=l1&plan=p1&renewal=not_saved";
    render(<CheckoutSuccessPage />);
    expect(await screen.findByRole("status")).toHaveTextContent("We couldn't save this card for renewals.");
  });
});
