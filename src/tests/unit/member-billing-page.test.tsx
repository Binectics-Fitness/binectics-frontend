import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BillingClient } from "@/app/dashboard/member/billing/BillingClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { memberBillingService, type PaymentMethodView } from "@/lib/api/memberBilling";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus,
  type MembershipSubscription,
} from "@/lib/types";

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member/billing",
  useSearchParams: () => new URLSearchParams(),
}));

const DAY = 86_400_000;
const soon = new Date(Date.now() + 5 * DAY).toISOString();
const later = new Date(Date.now() + 25 * DAY).toISOString();

function sub(over: Partial<MembershipSubscription> = {}): MembershipSubscription {
  return {
    _id: "s1",
    organization_id: { _id: "o1", name: "Iron Temple" },
    plan_id: {
      _id: "p1",
      name: "Monthly",
      plan_type: MembershipPlanType.SUBSCRIPTION,
      duration_days: 30,
      price_minor: 2_500_000,
      currency: "NGN",
      features: [],
    },
    listing_id: { _id: "l1", headline: "Iron Temple" },
    member_user_id: "u1",
    status: MembershipSubscriptionStatus.ACTIVE,
    start_date: "2026-09-20T00:00:00Z",
    end_date: later,
    amount_paid_minor: 2_500_000,
    currency: "NGN",
    auto_renew: false,
    collection_method: "pay_link",
    created_at: "",
    updated_at: "",
    ...over,
  };
}

const visa: PaymentMethodView = {
  id: "pm1",
  organization_id: "o1",
  provider_name: "Iron Temple",
  brand: "visa",
  card_type: "visa",
  last4: "4081",
  exp_month: 9,
  exp_year: 2027,
  bank: null,
  status: "active",
  invalid_reason: null,
  created_at: null,
  subscriptions: [
    {
      id: "s1",
      plan_id: "p1",
      plan_name: "Monthly",
      status: "active",
      next_charge_at: "2026-11-07T00:00:00.000Z",
      renewal_price_minor: 2_500_000,
      currency: "NGN",
    },
  ],
};

const offered = {
  offered: true as const,
  text_version: "mbr-renew-v1",
  text: "Renew automatically. I authorise Iron Temple to charge this card ₦25,000.00 every 30 days.",
  text_sha256: "a".repeat(64),
  rendered: {} as never,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BillingClient />
    </QueryClientProvider>,
  );
}

const getSubs = vi.spyOn(marketplaceService, "getMyMembershipSubscriptions");
const listCards = vi.spyOn(memberBillingService, "listPaymentMethods");
const removeCard = vi.spyOn(memberBillingService, "removePaymentMethod");
const setAutoRenew = vi.spyOn(memberBillingService, "setAutoRenew");
const subConsent = vi.spyOn(memberBillingService, "getSubscriptionAutoRenewConsent");

beforeEach(() => {
  vi.clearAllMocks();
  getSubs.mockResolvedValue({ success: true, data: [sub()] });
  listCards.mockResolvedValue({ success: true, data: [] });
});

describe("auto-renew switch", () => {
  it("is off when the server says off, and turning it on asks for a card when none is saved", async () => {
    setAutoRenew.mockResolvedValue({
      success: false,
      status: 400,
      code: "AUTO_RENEW_NEEDS_CARD",
      message: 'Pay your next renewal by card and tick "Renew automatically" to turn this on.',
    });
    renderPage();
    const sw = await screen.findByRole("switch", { name: /Auto-renew/ });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sw);
    expect(await screen.findByText(/needs a working card saved with this provider/)).toBeInTheDocument();
    // Not optimistic: still off.
    expect(screen.getByRole("switch", { name: /Auto-renew/ })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("link", { name: "Pay the next Monthly term by card" })).toHaveAttribute(
      "href",
      "/checkout?listing=l1&plan=p1",
    );
  });

  it("on CONSENT_REQUIRED shows the terms with an unticked box, then sends the consent", async () => {
    setAutoRenew
      .mockResolvedValueOnce({
        success: false,
        status: 400,
        code: "CONSENT_REQUIRED",
        message: "Review and accept the renewal terms to turn this on.",
        details: { consent: offered },
      })
      .mockResolvedValueOnce({
        success: true,
        data: sub({ auto_renew: true, collection_method: "card_auto", payment_method_id: "pm1" }),
      });
    renderPage();
    await userEvent.click(await screen.findByRole("switch", { name: /Auto-renew/ }));
    const dialog = await screen.findByRole("dialog", { name: "Turn on auto-renew" });
    const box = within(dialog).getByRole("checkbox", { name: offered.text });
    expect(box).not.toBeChecked();
    const turnOn = within(dialog).getByRole("button", { name: "Turn on auto-renew" });
    expect(turnOn).toBeDisabled();
    await userEvent.click(box);
    // The page re-reads memberships after the PATCH; the server now says on.
    getSubs.mockResolvedValue({
      success: true,
      data: [sub({ auto_renew: true, collection_method: "card_auto", payment_method_id: "pm1" })],
    });
    await userEvent.click(turnOn);
    await waitFor(() =>
      expect(setAutoRenew).toHaveBeenLastCalledWith(
        "s1",
        { text_version: "mbr-renew-v1", text_sha256: "a".repeat(64), channel: "web" },
        true,
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: /Auto-renew/ })).toHaveAttribute("aria-checked", "true"),
    );
  });

  it("reads the consent when the 400 doesn't carry it", async () => {
    setAutoRenew.mockResolvedValueOnce({ success: false, status: 400, code: "CONSENT_REQUIRED", message: "x" });
    subConsent.mockResolvedValue({ success: true, data: offered });
    renderPage();
    await userEvent.click(await screen.findByRole("switch", { name: /Auto-renew/ }));
    expect(await screen.findByRole("dialog", { name: "Turn on auto-renew" })).toBeInTheDocument();
    expect(subConsent).toHaveBeenCalledWith("s1");
  });

  it("re-shows changed terms, unticked, on 409 CONSENT_TEXT_CHANGED", async () => {
    const changed = { ...offered, text: "Renew automatically. New terms.", text_sha256: "b".repeat(64) };
    setAutoRenew
      .mockResolvedValueOnce({ success: false, status: 400, code: "CONSENT_REQUIRED", message: "x", details: { consent: offered } })
      .mockResolvedValueOnce({ success: false, status: 409, code: "CONSENT_TEXT_CHANGED", message: "y", details: { consent: changed } });
    renderPage();
    await userEvent.click(await screen.findByRole("switch", { name: /Auto-renew/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("checkbox"));
    await userEvent.click(within(dialog).getByRole("button", { name: "Turn on auto-renew" }));
    const fresh = await within(dialog).findByRole("checkbox", { name: changed.text });
    expect(fresh).not.toBeChecked();
    expect(within(dialog).getByRole("status")).toHaveTextContent(/terms changed/);
  });

  it("shows why when auto-renew isn't available", async () => {
    setAutoRenew.mockResolvedValue({
      success: false,
      status: 400,
      code: "AUTO_RENEW_NOT_AVAILABLE",
      message: "Automatic renewal is not available for this plan.",
      details: { reason: "no_provider_account" },
    });
    renderPage();
    await userEvent.click(await screen.findByRole("switch", { name: /Auto-renew/ }));
    expect(await screen.findByText(/doesn't take automatic card payments yet/)).toBeInTheDocument();
  });

  it("turns off and renders what the server returned", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [sub({ auto_renew: true, collection_method: "card_auto", payment_method_id: "pm1", next_charge_at: "2026-11-07T00:00:00.000Z", renewal_price_minor: 2_500_000 })],
    });
    listCards.mockResolvedValue({ success: true, data: [visa] });
    setAutoRenew.mockResolvedValue({ success: true, data: sub({ auto_renew: false, collection_method: "pay_link" }) });
    renderPage();
    const sw = await screen.findByRole("switch", { name: /Auto-renew/ });
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(await screen.findByText(/Next charge .* · ₦25,000 · Visa •••• 4081/)).toBeInTheDocument();
    await userEvent.click(sw);
    // The desired state goes with the call (sent once the API takes it).
    expect(setAutoRenew).toHaveBeenCalledWith("s1", undefined, false);
    expect(await screen.findByText(/Auto-renew is off. Your card stays saved/)).toBeInTheDocument();
  });

  it("isn't offered on a gym-enrolled membership", async () => {
    getSubs.mockResolvedValue({ success: true, data: [sub({ enrolled_by: "staff1" })] });
    renderPage();
    expect(await screen.findByText(/Your gym manages renewals/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});

describe("Renew", () => {
  it("shows Renew on a membership near its end, with the plan's checkout", async () => {
    getSubs.mockResolvedValue({ success: true, data: [sub({ end_date: soon })] });
    renderPage();
    expect(await screen.findByRole("link", { name: "Renew Monthly" })).toHaveAttribute(
      "href",
      "/checkout?listing=l1&plan=p1",
    );
  });

  it("leads with a pay-now banner for a past-due membership", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [sub({ status: MembershipSubscriptionStatus.PAST_DUE, grace_expires_at: soon })],
    });
    renderPage();
    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("Your Monthly payment didn't go through.");
    expect(within(banner).getByRole("link", { name: "Renew Monthly now" })).toHaveAttribute(
      "href",
      "/checkout?listing=l1&plan=p1",
    );
  });
});

describe("past due, card retries (no second payment)", () => {
  it("says when the card will be tried again, and offers no Renew, while retries remain", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [
        sub({
          status: MembershipSubscriptionStatus.PAST_DUE,
          grace_expires_at: soon,
          auto_renew: true,
          collection_method: "card_auto",
          renewal_retry: { pending: true, next_attempt_at: "2026-10-12T09:00:00.000Z" },
        }),
      ],
    });
    renderPage();
    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(/We'll try your card again on Oct 12, 2026/);
    expect(within(banner).queryByRole("link")).toBeNull();
    expect(screen.queryByRole("link", { name: /^Renew/ })).toBeNull();
  });

  it("without renewal_retry, treats a past-due card membership as still being retried", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [sub({ status: MembershipSubscriptionStatus.PAST_DUE, auto_renew: true, collection_method: "card_auto" })],
    });
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/try your card again soon/);
    expect(screen.queryByRole("link", { name: /^Renew/ })).toBeNull();
  });

  it("offers Renew once the API says no retry is pending", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [
        sub({
          status: MembershipSubscriptionStatus.PAST_DUE,
          auto_renew: true,
          collection_method: "card_auto",
          renewal_retry: { pending: false, next_attempt_at: null },
        }),
      ],
    });
    renderPage();
    expect(await screen.findByRole("link", { name: "Renew Monthly now" })).toBeInTheDocument();
  });

  it("hides the auto-renew toggle while past due and points to Cancel or Remove card", async () => {
    getSubs.mockResolvedValue({ success: true, data: [sub({ status: MembershipSubscriptionStatus.PAST_DUE })] });
    renderPage();
    expect(await screen.findByText(/can't be changed while a payment is due/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});

describe("saved cards", () => {
  it("doesn't count or list memberships that have ended", async () => {
    listCards.mockResolvedValue({
      success: true,
      data: [{ ...visa, subscriptions: [...visa.subscriptions, { ...visa.subscriptions[0], id: "old", plan_name: "Old Plan", status: "expired" }] }],
    });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Remove Visa •••• 4081" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Monthly");
    expect(dialog).not.toHaveTextContent("Old Plan");
    expect(screen.queryByText(/Old Plan/)).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Remove card" })).toHaveStyle({ background: "var(--danger-ink)" });
  });

  it("says so when there are none", async () => {
    renderPage();
    expect(await screen.findByText(/No saved cards/)).toBeInTheDocument();
  });

  it("lists cards by provider with brand, last4, expiry, status and what they renew", async () => {
    listCards.mockResolvedValue({
      success: true,
      data: [visa, { ...visa, id: "pm2", provider_name: "Ada Nutrition", last4: "1111", status: "expired", subscriptions: [] }],
    });
    renderPage();
    const section = (await screen.findByRole("heading", { name: "Saved cards" })).closest("section")!;
    await within(section).findByText("Visa •••• 4081");
    expect(within(section).getByRole("heading", { name: "Iron Temple" })).toBeInTheDocument();
    expect(within(section).getByRole("heading", { name: "Ada Nutrition" })).toBeInTheDocument();
    expect(within(section).getAllByText(/Expires 09\/27/)).toHaveLength(2);
    expect(within(section).getByText("Active")).toBeInTheDocument();
    expect(within(section).getByText("Expired")).toBeInTheDocument();
    expect(within(section).getByText(/Monthly: next charge .* · ₦25,000/)).toBeInTheDocument();
  });

  it("asks before removing a card, says auto-renew stops on its memberships, then removes it", async () => {
    listCards.mockResolvedValue({ success: true, data: [visa] });
    removeCard.mockResolvedValue({ success: true, data: { id: "pm1", status: "revoked" } });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Remove Visa •••• 4081" }));
    const dialog = await screen.findByRole("dialog", { name: "Remove this card?" });
    expect(dialog).toHaveTextContent("Auto-renew stops on these memberships:");
    expect(dialog).toHaveTextContent("Monthly");
    expect(removeCard).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove card" }));
    await waitFor(() => expect(removeCard).toHaveBeenCalledWith("pm1"));
  });

  it("keeps the card when the member backs out", async () => {
    listCards.mockResolvedValue({ success: true, data: [visa] });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Remove Visa •••• 4081" }));
    await userEvent.click(await screen.findByRole("button", { name: "Keep card" }));
    expect(removeCard).not.toHaveBeenCalled();
  });

  it("shows why a removal failed", async () => {
    listCards.mockResolvedValue({ success: true, data: [visa] });
    removeCard.mockResolvedValue({ success: false, status: 404, message: "Card not found" });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Remove Visa •••• 4081" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove card" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Card not found");
  });
});
