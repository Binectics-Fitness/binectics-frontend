import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProviderIncomeSummary } from "@/components/ProviderIncomeSummary";
import { earningsService, type IncomeSummary } from "@/lib/api/earnings";
import { incomeSummaryCsv, minorToDecimalString } from "@/lib/money/incomeSummaryCsv";

let mockGym: { _id: string; name: string } | null = null;
let mockOrg: { _id: string } | null = { _id: "o1" };

vi.mock("@/hooks/useTrainerAccess", () => ({ useCoachingGym: () => mockGym }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: mockOrg, isLoading: false }),
}));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({
    fmtMoney: (major: number, currency: string) => `${currency} ${major}`,
    fmtNumber: (n: number) => String(n),
  }),
}));

const summary = (over: Partial<IncomeSummary> = {}): IncomeSummary => ({
  year: 2026,
  time_zone: "UTC",
  years: [2026, 2025],
  currencies: [
    {
      currency: "NGN",
      gross_minor: 2_200_000,
      refunds_minor: 200_000,
      adjustments_minor: 0,
      net_minor: 2_000_000,
      transaction_count: 4,
      months: [
        { month: "2026-03", gross_minor: 1_500_000, refunds_minor: 200_000, adjustments_minor: 0, net_minor: 1_300_000, transaction_count: 3 },
        { month: "2026-05", gross_minor: 700_000, refunds_minor: 0, adjustments_minor: 0, net_minor: 700_000, transaction_count: 1 },
      ],
    },
  ],
  ...over,
});

function renderIt() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProviderIncomeSummary />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockGym = null;
  mockOrg = { _id: "o1" };
});

describe("ProviderIncomeSummary", () => {
  it("shows monthly rows and the year total in the currency's own units, labelled informational", async () => {
    vi.spyOn(earningsService, "getIncomeSummary").mockResolvedValue({ success: true, data: summary() } as never);
    renderIt();
    expect(await screen.findByText(/NGN · 2026/)).toBeInTheDocument();
    expect(screen.getByText(/not tax advice/i)).toBeInTheDocument();
    const mar = screen.getByText("Mar 2026").closest("tr")!;
    expect(within(mar).getByText("NGN 15000")).toBeInTheDocument();
    expect(within(mar).getByText("NGN 13000")).toBeInTheDocument();
    const total = screen.getByText("Year total").closest("tr")!;
    expect(within(total).getByText("NGN 20000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeInTheDocument();
  });

  it("asks for another year when its chip is pressed", async () => {
    const spy = vi.spyOn(earningsService, "getIncomeSummary").mockResolvedValue({ success: true, data: summary() } as never);
    renderIt();
    await screen.findByText(/NGN · 2026/);
    await userEvent.click(screen.getByRole("button", { name: "2025" }));
    expect(spy).toHaveBeenLastCalledWith("o1", 2025);
  });

  it("shows an honest empty state with no numbers and no CSV when nothing is recorded", async () => {
    vi.spyOn(earningsService, "getIncomeSummary").mockResolvedValue({
      success: true,
      data: summary({ years: [], currencies: [] }),
    } as never);
    renderIt();
    expect(await screen.findByText("Nothing recorded in 2026.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download CSV" })).not.toBeInTheDocument();
    expect(screen.queryByText(/NGN/)).not.toBeInTheDocument();
  });

  it("shows an error rather than zeros when the request fails", async () => {
    vi.spyOn(earningsService, "getIncomeSummary").mockResolvedValue({ success: false, message: "no" } as never);
    renderIt();
    expect(await screen.findByText(/couldn.t load your summary/i)).toBeInTheDocument();
  });

  it("does not call the API for a gym's staff trainer and points to the gym", () => {
    mockGym = { _id: "g1", name: "Iron Temple" };
    const spy = vi.spyOn(earningsService, "getIncomeSummary");
    renderIt();
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByText(/paid through Iron Temple/)).toBeInTheDocument();
  });
});

describe("income summary CSV", () => {
  it("writes decimals by each currency's exponent, not a fixed 100", () => {
    expect(minorToDecimalString(12345, "NGN")).toBe("123.45");
    expect(minorToDecimalString(12345, "JPY")).toBe("12345");
    expect(minorToDecimalString(12345, "KWD")).toBe("12.345");
    expect(minorToDecimalString(-5, "USD")).toBe("-0.05");
  });

  it("has a header and one row per currency and month", () => {
    const csv = incomeSummaryCsv(summary());
    expect(csv.split("\n")).toEqual([
      "Year,Month,Currency,Payments received,Refunds,Adjustments,Net,Transactions",
      "2026,2026-03,NGN,15000.00,2000.00,0.00,13000.00,3",
      "2026,2026-05,NGN,7000.00,0.00,0.00,7000.00,1",
      "",
    ]);
  });
});
