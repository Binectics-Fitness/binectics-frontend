import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PayoutHistory } from "@/app/dashboard/gym-owner/payouts/PayoutHistory";
import { earningsService, type PayoutOverview } from "@/lib/api/earnings";

vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({
    fmtMoney: (major: number, currency: string) => `${currency} ${major}`,
    fmtDateTime: (d: string) => `at:${d.slice(0, 10)}`,
  }),
}));

function renderIt() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PayoutHistory orgId="o1" />
    </QueryClientProvider>,
  );
}

const overview = (over: Partial<PayoutOverview["currencies"][number]> = {}): PayoutOverview => ({
  currencies: [
    {
      currency: "NGN",
      provider_account_net_minor: 400_000,
      platform_account_net_minor: 750_000,
      unattributed_net_minor: 0,
      paid_out_minor: 0,
      payout_count: 0,
      ...over,
    },
  ],
});

const ok = <T,>(data: T) => ({ success: true, data }) as never;

beforeEach(() => vi.restoreAllMocks());

describe("PayoutHistory", () => {
  it("shows money by collecting account in the currency's own units and an honest empty payout list", async () => {
    vi.spyOn(earningsService, "getPayoutOverview").mockResolvedValue(ok(overview()));
    const tx = vi.spyOn(earningsService, "getOrgTransactions").mockResolvedValue(ok({ items: [], total: 0, page: 1, limit: 25 }));
    renderIt();
    expect(await screen.findByText("NGN 7500")).toBeInTheDocument();
    expect(screen.getByText("NGN 4000")).toBeInTheDocument();
    expect(screen.getByText("Collected by Binectics for you")).toBeInTheDocument();
    expect(screen.queryByText("Earlier payments (account not recorded)")).not.toBeInTheDocument();
    expect(await screen.findByText("No payouts recorded yet.")).toBeInTheDocument();
    expect(tx).toHaveBeenCalledWith("o1", { type: "payout", status: "succeeded", limit: 25 });
    expect(screen.queryByText(/balance:/i)).not.toBeInTheDocument();
  });

  it("lists payouts that exist", async () => {
    vi.spyOn(earningsService, "getPayoutOverview").mockResolvedValue(ok(overview({ paid_out_minor: 600_000, payout_count: 1 })));
    vi.spyOn(earningsService, "getOrgTransactions").mockResolvedValue(
      ok({ items: [{ _id: "p1", amount_minor: 600_000, currency: "NGN", occurred_at: "2026-10-20T10:00:00Z" }], total: 1, page: 1, limit: 25 }),
    );
    renderIt();
    expect(await screen.findByText("at:2026-10-20")).toBeInTheDocument();
    expect(screen.getAllByText("NGN 6000").length).toBeGreaterThan(0);
  });

  it("says no payments recorded, not zeros, when the ledger is empty", async () => {
    vi.spyOn(earningsService, "getPayoutOverview").mockResolvedValue(ok({ currencies: [] }));
    vi.spyOn(earningsService, "getOrgTransactions").mockResolvedValue(ok({ items: [], total: 0, page: 1, limit: 25 }));
    renderIt();
    expect(await screen.findByText("No payments recorded yet.")).toBeInTheDocument();
  });

  it("shows errors instead of numbers when both requests fail", async () => {
    vi.spyOn(earningsService, "getPayoutOverview").mockResolvedValue({ success: false, message: "no" } as never);
    vi.spyOn(earningsService, "getOrgTransactions").mockResolvedValue({ success: false, message: "no" } as never);
    renderIt();
    expect(await screen.findByText(/Only the workspace owner can see payment records/)).toBeInTheDocument();
    expect(await screen.findByText(/couldn.t load your payouts/i)).toBeInTheDocument();
  });
});
