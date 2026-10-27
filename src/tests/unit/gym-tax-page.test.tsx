import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GymTaxClient } from "@/app/dashboard/gym-owner/tax/GymTaxClient";
import { checkinsService } from "@/lib/api/checkins";

let mockOrg: Record<string, unknown> = {};

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "o1" } }),
}));
vi.mock("@/lib/queries/teams", () => ({ useOrganizationDetails: () => ({ data: mockOrg }) }));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtMoney: (major: number, currency: string) => `${currency} ${major}` }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(checkinsService, "getOrgRevenueStats").mockResolvedValue({
    success: true,
    data: { currency: "NGN", timeseries: [{ date: "2026-10-01", revenue_minor: 1_075_000, currency: "NGN" }], new_members_count: 0 },
  } as never);
});

function renderTax() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GymTaxClient />
    </QueryClientProvider>,
  );
}

describe("gym tax page", () => {
  it("does not guess when the flag was never saved: no estimate, a prompt to choose", async () => {
    mockOrg = { tax_rate: 7.5, tax_label: "VAT" };
    renderTax();
    expect(await screen.findByText(/Choose whether your prices already include tax/)).toBeInTheDocument();
    expect(screen.queryByText(/Estimated VAT/)).not.toBeInTheDocument();
    expect(screen.queryByText("NGN 750")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose in Settings" })).toHaveAttribute("href", "/dashboard/gym-owner/settings#tax");
  });

  it("adds the tax on top when the flag was saved as off", async () => {
    mockOrg = { tax_rate: 7.5, tax_label: "VAT", tax_inclusive: false };
    renderTax();
    expect(await screen.findByText(/\(added on top\)/)).toBeInTheDocument();
    // 10,750 x 7.5 / 100 = 806.25
    expect(screen.getByText("NGN 806.25")).toBeInTheDocument();
  });

  it("keeps a flag saved as on inclusive", async () => {
    mockOrg = { tax_rate: 7.5, tax_label: "VAT", tax_inclusive: true };
    renderTax();
    expect(await screen.findByText(/\(included in prices\)/)).toBeInTheDocument();
  });
});
