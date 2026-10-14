import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BillingClient } from "@/app/dashboard/member/billing/BillingClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { memberBillingService } from "@/lib/api/memberBilling";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus,
  type MembershipSubscription,
} from "@/lib/types";
import { formatDate } from "@/utils/format";

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member/billing",
  useSearchParams: () => new URLSearchParams(),
}));

const DAY = 86_400_000;
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
const pause = vi.spyOn(marketplaceService, "pauseMembershipSubscription");
const resume = vi.spyOn(marketplaceService, "resumeMembershipSubscription");

beforeEach(() => {
  vi.clearAllMocks();
  getSubs.mockResolvedValue({ success: true, data: [sub()] });
  listCards.mockResolvedValue({ success: true, data: [] });
});

const dialogLines = (dialog: HTMLElement) =>
  within(within(dialog).getByTestId("hold-copy"))
    .getAllByText(/./, { selector: "p" })
    .map((p) => p.textContent);

describe("pausing a membership", () => {
  it("explains what pausing does before anything is sent", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Pause Monthly" }));
    const dialog = await screen.findByRole("dialog", { name: "Pause this membership?" });
    expect(dialogLines(dialog)).toEqual([
      "Your Monthly membership with Iron Temple.",
      "Your membership pauses today. You can't check in or book classes while it's paused.",
      `It's due to end on ${formatDate(later)}. That date moves later by the days you're paused.`,
      "Resume it here any time.",
    ]);
    expect(pause).not.toHaveBeenCalled();
  });

  it("on card auto-renew, says the card isn't charged while paused", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [sub({ auto_renew: true, collection_method: "card_auto", payment_method_id: "pm1" })],
    });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Pause Monthly" }));
    const dialog = await screen.findByRole("dialog", { name: "Pause this membership?" });
    expect(dialog).toHaveTextContent(
      "Auto-renew won't charge your card while paused. It carries on for the new end date once you resume.",
    );
  });

  it("pauses on confirm, with the buttons disabled while it is sent, then re-reads", async () => {
    let finish!: (v: unknown) => void;
    pause.mockReturnValue(new Promise((r) => (finish = r)) as never);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Pause Monthly" }));
    const dialog = await screen.findByRole("dialog", { name: "Pause this membership?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Pause membership" }));
    expect(pause).toHaveBeenCalledWith("s1");
    expect(within(dialog).getByRole("button", { name: "Pausing…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Keep it active" })).toBeDisabled();
    getSubs.mockResolvedValue({
      success: true,
      data: [sub({ status: MembershipSubscriptionStatus.PAUSED, paused_at: new Date().toISOString() })],
    });
    finish({ success: true, data: sub({ status: MembershipSubscriptionStatus.PAUSED }) });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "Resume Monthly" })).toBeInTheDocument();
  });

  it("shows the API's refusal inside the dialog and stays open", async () => {
    pause.mockResolvedValue({
      success: false,
      status: 400,
      message: "Only an active membership can be paused. Check the membership status and try again.",
    });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Pause Monthly" }));
    const dialog = await screen.findByRole("dialog", { name: "Pause this membership?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Pause membership" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Only an active membership can be paused. Check the membership status and try again.",
    );
    expect(within(dialog).getByRole("button", { name: "Pause membership" })).toBeEnabled();
  });

  it("is not offered once the term has ended, or for a membership that isn't active", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [
        sub({ _id: "a", end_date: new Date(Date.now() - DAY).toISOString() }),
        sub({ _id: "b", status: MembershipSubscriptionStatus.PAST_DUE }),
        sub({ _id: "c", status: MembershipSubscriptionStatus.PENDING_PAYMENT }),
        sub({ _id: "d", status: MembershipSubscriptionStatus.EXPIRED }),
      ],
    });
    renderPage();
    await screen.findAllByText("Monthly");
    expect(screen.queryByRole("button", { name: /^Pause/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Resume/ })).not.toBeInTheDocument();
  });
});

describe("a paused membership", () => {
  const pausedAt = new Date(Date.now() - 3 * DAY - 60_000).toISOString();
  const paused = () =>
    sub({
      status: MembershipSubscriptionStatus.PAUSED,
      paused_at: pausedAt,
      auto_renew: true,
      collection_method: "card_auto",
      payment_method_id: "pm1",
      next_charge_at: new Date(Date.now() + 24 * DAY).toISOString(),
    });

  it("says since when, the end date if resumed now, and that the card isn't charged", async () => {
    getSubs.mockResolvedValue({ success: true, data: [paused()] });
    renderPage();
    const line = await screen.findByTestId("paused-line");
    const resumedEnd = new Date(Date.parse(later) + (Date.now() - Date.parse(pausedAt)));
    expect(line).toHaveTextContent(`Paused since ${formatDate(pausedAt)} (3 days).`);
    expect(line).toHaveTextContent(`Resume today and it runs to ${formatDate(resumedEnd)}.`);
    expect(line).toHaveTextContent("You can't check in or book classes until you resume.");
    expect(screen.getByText("Auto-renew won't charge your card while paused.")).toBeInTheDocument();
    // The stale "next charge" date from before the pause is not shown.
    expect(screen.queryByText(/Next charge/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pause Monthly" })).not.toBeInTheDocument();
  });

  it("resumes on confirm and says the new end date", async () => {
    getSubs.mockResolvedValue({ success: true, data: [paused()] });
    resume.mockResolvedValue({ success: true, data: sub({ end_date: later }) });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Resume Monthly" }));
    const dialog = await screen.findByRole("dialog", { name: "Resume this membership?" });
    expect(dialog).toHaveTextContent("You can check in and book again straight away.");
    expect(dialog).toHaveTextContent("The days you were paused are added back, so it now runs to");
    await userEvent.click(within(dialog).getByRole("button", { name: "Resume membership" }));
    expect(resume).toHaveBeenCalledWith("s1");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("a failed resume shows inline", async () => {
    getSubs.mockResolvedValue({ success: true, data: [paused()] });
    resume.mockRejectedValue(new Error("network"));
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Resume Monthly" }));
    const dialog = await screen.findByRole("dialog", { name: "Resume this membership?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Resume membership" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "We couldn't resume this membership. Please try again.",
    );
  });
});

describe("a suspended membership", () => {
  it("shows the gym's reason and who to contact, and offers no pause or resume", async () => {
    getSubs.mockResolvedValue({
      success: true,
      data: [
        sub({
          status: MembershipSubscriptionStatus.SUSPENDED,
          suspended_at: "2026-10-10T09:00:00Z",
          suspension_reason: "Unpaid locker fee",
        }),
      ],
    });
    renderPage();
    expect(await screen.findByTestId("suspended-line")).toHaveTextContent(
      `Iron Temple suspended this membership on ${formatDate("2026-10-10T09:00:00Z")}: “Unpaid locker fee”. Contact Iron Temple to restore your access.`,
    );
    expect(screen.queryByRole("button", { name: /^Pause/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Resume/ })).not.toBeInTheDocument();
    // The API takes no auto-renew change while suspended: no dead switch.
    expect(screen.queryByRole("switch", { name: /Auto-renew/ })).not.toBeInTheDocument();
  });
});
