import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrainerPlansClient from "@/app/dashboard/trainer/plans/PlansClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { toast } from "@/components/Toast";
import { currency } from "../setup/currencyFixtures";

/**
 * The trainer plan editor prices only in currencies the platform can take
 * payment in, starts from the org default only when that is one of them,
 * and says why the server refused a currency.
 */

const CURRENCIES = [
  currency("NGN", { name: "Nigerian Naira", symbol: "₦" }),
  currency("GHS", { name: "Ghanaian Cedi", selectable: { price: false, charge_card: false } }),
  currency("USD", { name: "US Dollar", symbol: "$" }),
];
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({ data: CURRENCIES, all: CURRENCIES, isLoading: false }),
}));

const org = vi.hoisted(() => ({
  currentOrg: { _id: "org-1", currency: "NGN" } as { _id: string; currency?: string },
  isLoading: false,
}));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => org }));
vi.mock("@/components/ds/TrainerDashboardShell", () => ({
  TrainerDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/SearchableSelect", () => ({
  default: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) => (
    <select aria-label="Currency" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

const currencySelect = () =>
  screen.getAllByLabelText("Currency").find((el) =>
    Array.from((el as HTMLSelectElement).options).some((o) => o.value === "NGN"),
  ) as HTMLSelectElement;

async function openCreate() {
  const user = userEvent.setup();
  render(<TrainerPlansClient />);
  await waitFor(() => expect(screen.getAllByRole("button", { name: /New plan|Create first plan/ })[0]).toBeEnabled());
  await user.click(screen.getAllByRole("button", { name: /New plan|Create first plan/ })[0]);
  await user.type(screen.getByPlaceholderText("e.g. Monthly training subscription"), "Monthly");
  return user;
}

describe("trainer plan currency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    org.currentOrg = { _id: "org-1", currency: "NGN" };
    vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [] });
  });

  it("offers only currencies prices can be set in", async () => {
    await openCreate();
    const values = Array.from(currencySelect().options).map((o) => o.value).filter(Boolean);
    expect(values).toEqual(["NGN", "USD"]);
  });

  it("starts from the org's currency when it can be priced in", async () => {
    await openCreate();
    expect(currencySelect().value).toBe("NGN");
  });

  it("requires a choice when the org's currency can't be priced in", async () => {
    org.currentOrg = { _id: "org-1", currency: "GHS" };
    const create = vi.spyOn(marketplaceService, "createOrgMembershipPlan");
    const user = await openCreate();
    expect(currencySelect().value).toBe("");
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose the currency this plan is priced in.");
    expect(create).not.toHaveBeenCalled();
  });

  it("shows the CURRENCY_NOT_SELECTABLE message and reasons on save", async () => {
    vi.spyOn(marketplaceService, "createOrgMembershipPlan").mockResolvedValue({
      success: false,
      status: 400,
      code: "CURRENCY_NOT_SELECTABLE",
      message: "Prices can't be set in NGN right now.",
      details: {
        reasons: [{ code: "gateway_account_disabled", message: "Paystack can charge NGN, but it isn't enabled on our account" }],
      },
    });
    const user = await openCreate();
    await user.click(screen.getByRole("button", { name: "Create plan" }));
    const expected =
      "Prices can't be set in NGN right now. Paystack can charge NGN, but it isn't enabled on our account.";
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
    expect(toast.error).toHaveBeenCalledWith(expected);
  });
});
