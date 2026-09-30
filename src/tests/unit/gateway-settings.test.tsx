import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GatewaysSection } from "@/components/provider/GatewaysSection";
import { payoutOptions } from "@/app/onboarding/_payout";
import { normalizePaymentGateways, type PublicPaymentGateway } from "@/lib/api/paymentGateways";

/**
 * Provider payment settings offer only the gateways GET /payment-gateways
 * says a provider may connect. Saved Stripe or Flutterwave keys read as no
 * longer supported and can be removed; a GATEWAY_NOT_SUPPORTED refusal shows
 * the server's message.
 */

const GATEWAYS: PublicPaymentGateway[] = [
  { gateway: "paystack", label: "Paystack", provider_keys_supported: true, currencies: ["NGN"] },
];

const h = vi.hoisted(() => ({
  configs: [] as { gateway: string; public_key: string; is_active: boolean; currencies: { code: string; verified_at: string; verified_via: string }[] }[],
  upsert: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "org-1" } }),
}));
vi.mock("@/lib/queries/marketplace", () => ({
  useOrgPaymentConfigs: () => ({ data: h.configs, isLoading: false }),
  useUpsertPaymentConfig: () => ({ mutateAsync: h.upsert, isPending: false }),
  useDeletePaymentConfig: () => ({ mutateAsync: h.remove, isPending: false }),
  useVerifyProviderCurrency: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveProviderCurrency: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRefreshProviderCurrencies: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  usePaymentGateways: () => ({
    data: GATEWAYS,
    isSuccess: true,
    isError: false,
    isPending: false,
    refetch: h.refetch,
  }),
  useOrgPriceCurrencies: () => ({ data: [], isLoading: false, isError: false, providerHint: "Your Paystack account" }),
}));
vi.mock("@/components/SearchableSelect", () => ({
  default: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) => (
    <select aria-label="Gateway" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

describe("GatewaysSection", () => {
  beforeEach(() => {
    h.configs = [];
    h.upsert.mockReset();
    h.remove.mockReset();
    h.refetch.mockReset();
  });

  it("offers only the gateways a provider may connect", async () => {
    render(<GatewaysSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add gateway" }));
    const select = screen.getByRole("combobox", { name: "Gateway" });
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["Paystack"]);
  });

  it("marks saved Stripe keys as no longer supported and lets the owner remove them", async () => {
    h.configs = [
      { gateway: "stripe", public_key: "pk_live_abcdefghijklmnop", is_active: true, currencies: [] },
      { gateway: "paystack", public_key: "pk_live_1234567890abcdef", is_active: true, currencies: [] },
    ];
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<GatewaysSection />);

    const stripeRow = screen.getByText("Stripe").closest("div.flex") as HTMLElement;
    expect(within(stripeRow.parentElement as HTMLElement).getByText("No longer supported")).toBeInTheDocument();
    expect(screen.getAllByText("No longer supported")).toHaveLength(1);

    h.remove.mockResolvedValue({ success: true });
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await userEvent.click(removeButtons[0]);
    expect(h.remove).toHaveBeenCalledWith("stripe");
    // Paystack is connected and nothing else can be, so there is nothing to add.
    expect(screen.queryByRole("button", { name: "+ Add gateway" })).toBeNull();
  });

  it("shows the server's message when the gateway is refused", async () => {
    h.upsert.mockResolvedValue({
      success: false,
      code: "GATEWAY_NOT_SUPPORTED",
      message: "You can't connect Stripe yet. You can connect Paystack.",
    });
    render(<GatewaysSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add gateway" }));
    await userEvent.type(screen.getByPlaceholderText("pk_live_…"), "pk");
    await userEvent.type(screen.getByPlaceholderText("sk_live_…"), "sk");
    await userEvent.click(screen.getByRole("button", { name: "Save gateway" }));
    expect(h.upsert).toHaveBeenCalledWith(expect.objectContaining({ gateway: "paystack" }));
    expect(await screen.findByText("You can't connect Stripe yet. You can connect Paystack.")).toBeInTheDocument();
    expect(h.refetch).toHaveBeenCalled();
  });
});

describe("onboarding payout options", () => {
  it("come from /payment-gateways, keys-supported only, then skip", () => {
    const opts = payoutOptions([
      ...GATEWAYS,
      { gateway: "flutterwave", label: "Flutterwave", provider_keys_supported: false, currencies: [] },
    ]);
    expect(opts.map((o) => o.id)).toEqual(["paystack", "skip"]);
    expect(opts[0].desc).toContain("NGN");
    expect(payoutOptions(undefined).map((o) => o.id)).toEqual(["skip"]);
  });

  it("normalises the gateway response", () => {
    expect(
      normalizePaymentGateways([
        { gateway: "Paystack", label: "Paystack", provider_keys_supported: true, currencies: ["ngn", 4] },
        { label: "no id" },
      ]),
    ).toEqual([{ gateway: "paystack", label: "Paystack", provider_keys_supported: true, currencies: ["NGN"] }]);
  });
});
