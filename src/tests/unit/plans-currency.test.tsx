import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrainerPlansClient from "@/app/dashboard/trainer/plans/PlansClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { toast } from "@/components/Toast";
import { orgPrice } from "../setup/currencyFixtures";
import type { OrgPriceCurrency } from "@/lib/api/currencies";

/**
 * The trainer plan editor prices only in currencies the org's membership
 * prices can use (GET .../price-currencies: the platform's, plus ones verified
 * on the org's own Paystack account), starts from the org default only when
 * that is one of them, and says why the server refused a currency.
 */

const BASE: OrgPriceCurrency[] = [
  orgPrice("NGN", { name: "Nigerian Naira", symbol: "₦" }),
  orgPrice("GHS", { name: "Ghanaian Cedi", selectable: false }),
  orgPrice("USD", { name: "US Dollar", symbol: "$" }),
];
const cur = vi.hoisted(() => ({ list: [] as unknown[], orgIds: [] as unknown[] }));
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: (orgId: unknown) => {
    cur.orgIds.push(orgId);
    return { data: cur.list, isLoading: false, isError: false, providerHint: "Your Paystack account" };
  },
}));

const org = vi.hoisted(() => ({
  currentOrg: { _id: "org-1", currency: "NGN" } as { _id: string; currency?: string },
  isLoading: false,
}));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => org, useOptionalOrganization: () => org }));
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
    cur.list = BASE;
    cur.orgIds = [];
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

  it("offers a currency verified on the org's own Paystack account, marked as such", async () => {
    cur.list = [
      ...BASE.filter((c) => c.code !== "GHS"),
      orgPrice("GHS", { name: "Ghanaian Cedi", symbol: "GH₵", route: "provider" }),
    ];
    const user = await openCreate();
    expect(cur.orgIds).toContain("org-1");
    const select = currencySelect();
    const ghs = Array.from(select.options).find((o) => o.value === "GHS");
    expect(ghs?.textContent).toBe("GHS · GH₵, Ghanaian Cedi (Your Paystack account)");
    await user.selectOptions(select, "GHS");
    expect(
      screen.getByText("GHS is paid only through your Paystack account. Keep it connected so members can pay."),
    ).toBeInTheDocument();
  });

  it("keeps a plan's saved currency visible when it can no longer be used", async () => {
    vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "p1",
          name: "Cedi monthly",
          plan_type: "subscription",
          duration_days: 30,
          price_minor: 10000,
          currency: "GHS",
          features: [],
          is_active: true,
          is_public: true,
        },
      ],
    } as never);
    const user = userEvent.setup();
    render(<TrainerPlansClient />);
    await user.click((await screen.findAllByRole("button", { name: /Edit/ }))[0]);
    const ghs = Array.from(currencySelect().options).find((o) => o.value === "GHS");
    expect(ghs?.textContent).toBe("GHS (not available for new prices)");
  });
});
