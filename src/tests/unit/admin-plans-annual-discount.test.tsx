import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminPlansPage from "@/app/admin/plans/page";

/**
 * The annual discount is set by a Binectics admin on the yearly price in the
 * plans editor (owner ruling, Oct 20 2026). Typing it works the yearly amount
 * out from the monthly price, and the save sends the percentage.
 */

const listPlans = vi.fn();
const listPlanPrices = vi.fn();
const listCurrencies = vi.fn();
const upsertPlanPrice = vi.fn();

vi.mock("@/components/ds/AdminDashboardShell", () => ({
  AdminDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/components/SearchableSelect", () => ({
  default: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) => (
    <select aria-label={options.some((o) => o.value === "year") ? "Interval" : "Currency"} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));
vi.mock("@/lib/api/admin", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/admin")>()),
  adminService: {
    listPlans: (...a: unknown[]) => listPlans(...a),
    listPlanPrices: (...a: unknown[]) => listPlanPrices(...a),
    listCurrencies: (...a: unknown[]) => listCurrencies(...a),
    upsertPlanPrice: (...a: unknown[]) => upsertPlanPrice(...a),
  },
}));

const proPlan = {
  _id: "p1",
  code: "pro",
  name: "Pro",
  description: "",
  sort_order: 1,
  is_active: true,
  max_active_members: 50,
  max_membership_plans: 10,
  max_staff_members: 3,
  max_listings: 1,
};

const monthly = {
  _id: "m1",
  plan_code: "pro",
  market_code: "NG",
  currency: "NGN",
  amount_minor: 1_500_000,
  overage_per_seat_minor: 50_000,
  interval: "month" as const,
  is_active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  listPlans.mockResolvedValue({ success: true, data: [proPlan] });
  listPlanPrices.mockResolvedValue({
    success: true,
    data: [monthly, { ...monthly, _id: "y1", interval: "year", amount_minor: 14_400_000, discount_percent: 20 }],
  });
  listCurrencies.mockResolvedValue({
    success: true,
    data: [{ code: "NGN", name: "Naira", effective: { provider_billing: { selectable: true } } }],
  });
  upsertPlanPrice.mockImplementation(async (body: Record<string, unknown>) => ({ success: true, data: { _id: "new", ...body } }));
});

describe("admin plans editor: annual discount", () => {
  it("tells the admin what providers see on a discounted yearly price", async () => {
    render(<AdminPlansPage />);
    expect(await screen.findByText(/Providers see .Save 20%./)).toBeInTheDocument();
  });

  it("works the yearly amount out from the discount and saves the percentage", async () => {
    render(<AdminPlansPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Add price" }));
    fireEvent.change(screen.getByDisplayValue("GLOBAL"), { target: { value: "NG" } });
    await waitFor(() => expect(screen.getByLabelText("Currency")).toHaveValue("NGN"));
    fireEvent.change(screen.getByLabelText("Interval"), { target: { value: "year" } });
    fireEvent.change(screen.getByLabelText("Annual discount percent"), { target: { value: "15" } });

    // 12 × ₦15,000 less 15% = ₦153,000.
    expect(screen.getByDisplayValue("153000")).toBeInTheDocument();
    expect(screen.getByText(/Providers will see "Save 15%"/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. 500"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Save price" }));
    await waitFor(() => expect(upsertPlanPrice).toHaveBeenCalled());
    expect(upsertPlanPrice.mock.calls[0][0]).toMatchObject({
      plan_code: "pro",
      market_code: "NG",
      interval: "year",
      currency: "NGN",
      amount_minor: 15_300_000,
      discount_percent: 15,
    });
  });

  it("Edit reopens a yearly price with its saved discount, so a re-save keeps it", async () => {
    render(<AdminPlansPage />);
    const edits = await screen.findAllByRole("button", { name: "Edit" });
    // Rows render in list order: monthly, then yearly.
    fireEvent.click(edits[1]);
    expect(screen.getByLabelText("Annual discount percent")).toHaveValue(20);
    expect(screen.getByDisplayValue("144000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save price" }));
    await waitFor(() => expect(upsertPlanPrice).toHaveBeenCalled());
    expect(upsertPlanPrice.mock.calls[0][0]).toMatchObject({
      interval: "year",
      audience: "ALL",
      amount_minor: 14_400_000,
      discount_percent: 20,
    });
  });

  it("switching a new price to yearly picks up the saved discount for that market", async () => {
    render(<AdminPlansPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Add price" }));
    fireEvent.change(screen.getByDisplayValue("GLOBAL"), { target: { value: "NG" } });
    fireEvent.change(screen.getByLabelText("Interval"), { target: { value: "year" } });
    expect(screen.getByLabelText("Annual discount percent")).toHaveValue(20);
  });

  it("works the yearly amount out from the shared monthly price, not an audience override", async () => {
    listPlanPrices.mockResolvedValue({
      success: true,
      data: [
        // A gym-only monthly override at ₦9,000 sits before the shared ₦15,000.
        { ...monthly, _id: "m-gym", audience: "gym_owner", amount_minor: 900_000 },
        monthly,
      ],
    });
    render(<AdminPlansPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Add price" }));
    fireEvent.change(screen.getByDisplayValue("GLOBAL"), { target: { value: "NG" } });
    await waitFor(() => expect(screen.getByLabelText("Currency")).toHaveValue("NGN"));
    fireEvent.change(screen.getByLabelText("Interval"), { target: { value: "year" } });
    fireEvent.change(screen.getByLabelText("Annual discount percent"), { target: { value: "10" } });
    // 12 × ₦15,000 less 10%, from the ALL row.
    expect(screen.getByDisplayValue("162000")).toBeInTheDocument();
  });

  it("warns that Paystack renews at its plan's amount when the amount of a coded price changes", async () => {
    listPlanPrices.mockResolvedValue({
      success: true,
      data: [
        monthly,
        {
          ...monthly,
          _id: "y1",
          interval: "year",
          amount_minor: 14_400_000,
          discount_percent: 20,
          gateway_prices: [{ gateway: "paystack", external_price_id: "PLN_year" }],
        },
      ],
    });
    render(<AdminPlansPage />);
    const edits = await screen.findAllByRole("button", { name: "Edit" });
    fireEvent.click(edits[1]);
    expect(screen.queryByText(/Paystack charges the amount set on that plan/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Annual discount percent"), { target: { value: "25" } });
    expect(screen.getByText(/renews through Paystack plan PLN_year/)).toBeInTheDocument();
  });

  it("sends no discount on a monthly price, and clamps a yearly one to 90", async () => {
    render(<AdminPlansPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Add price" }));
    fireEvent.change(screen.getByDisplayValue("GLOBAL"), { target: { value: "NG" } });
    await waitFor(() => expect(screen.getByLabelText("Currency")).toHaveValue("NGN"));
    fireEvent.change(screen.getByLabelText("Interval"), { target: { value: "year" } });
    fireEvent.change(screen.getByLabelText("Annual discount percent"), { target: { value: "95" } });
    expect(screen.getByText(/Providers will see "Save 90%"/)).toBeInTheDocument();

    // Back to monthly: the discount field goes and the save sends 0.
    fireEvent.change(screen.getByLabelText("Interval"), { target: { value: "month" } });
    expect(screen.queryByLabelText("Annual discount percent")).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("e.g. 500"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Save price" }));
    await waitFor(() => expect(upsertPlanPrice).toHaveBeenCalled());
    expect(upsertPlanPrice.mock.calls[0][0]).toMatchObject({ interval: "month", discount_percent: 0 });
  });
});
