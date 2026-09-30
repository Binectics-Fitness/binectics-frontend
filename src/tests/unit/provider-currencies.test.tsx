import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GatewaysSection } from "@/components/provider/GatewaysSection";
import { apiClient } from "@/lib/api/client";
import {
  marketplaceService,
  normalizePaymentConfig,
  providerCurrencyLocks,
} from "@/lib/api/marketplace";
import { normalizeOrgPriceCurrencies } from "@/lib/api/currencies";
import {
  describeCurrencyLock,
  orgPriceOptions,
  providerCurrencyMessage,
} from "@/lib/currencies/helpers";
import { toast } from "@/components/Toast";
import { orgPrice } from "../setup/currencyFixtures";

/**
 * Provider-account currencies (CURRENCY_MODEL.md): inside a connected,
 * active Paystack card the provider sees the platform's currencies as
 * included, the ones they added with when Paystack confirmed them, can add
 * one (the API checks it with Paystack and says why when it can't), remove
 * one (unless plans or payments depend on it), and re-check them all.
 */

const h = vi.hoisted(() => ({
  configs: [] as unknown[],
  priceRows: [] as unknown[],
  verify: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "org-1" } }),
}));
vi.mock("@/lib/queries/marketplace", () => ({
  useOrgPaymentConfigs: () => ({ data: h.configs, isLoading: false }),
  useUpsertPaymentConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePaymentConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useVerifyProviderCurrency: () => ({ mutateAsync: h.verify, isPending: false }),
  useRemoveProviderCurrency: () => ({ mutateAsync: h.remove, isPending: false }),
  useRefreshProviderCurrencies: () => ({ mutateAsync: h.refresh, isPending: false }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  usePaymentGateways: () => ({
    data: [{ gateway: "paystack", label: "Paystack", provider_keys_supported: true, currencies: ["NGN"] }],
    isSuccess: true,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
  useOrgPriceCurrencies: () => ({
    data: h.priceRows,
    isLoading: false,
    isError: false,
    providerHint: "Your Paystack account",
  }),
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/SearchableSelect", () => ({
  default: ({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; name?: string }) => (
    <select aria-label={name ?? "Gateway"} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

const GHS_VERIFIED = { code: "GHS", verified_at: "2026-09-30T10:00:00.000Z", verified_via: "paystack_balance" };

function connected(currencies: unknown[] = []) {
  h.configs = [{ gateway: "paystack", public_key: "pk_live_1234567890abcdef", is_active: true, currencies }];
}

const panel = () => screen.getByRole("list", { name: "Currencies on your Paystack account" });

async function addCurrency(code: string) {
  const user = userEvent.setup();
  render(<GatewaysSection />);
  await user.click(screen.getByRole("button", { name: "+ Add a currency" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "providerCurrency" }), code);
  await user.click(screen.getByRole("button", { name: "Check and add" }));
  return user;
}

describe("Currencies on your Paystack account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connected([GHS_VERIFIED]);
    h.priceRows = [
      orgPrice("NGN", { name: "Nigerian Naira" }),
      orgPrice("USD", { name: "US Dollar" }),
      orgPrice("GHS", { name: "Ghanaian Cedi", route: "provider" }),
    ];
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("lists the platform's currencies as included and the added ones with their check date", () => {
    render(<GatewaysSection />);
    const list = panel();
    const ngn = within(list).getByText("NGN").closest("li") as HTMLElement;
    expect(within(ngn).getByText("From Binectics")).toBeInTheDocument();
    expect(within(list).getAllByText("From Binectics")).toHaveLength(2);
    const ghs = within(list).getByText("GHS").closest("li") as HTMLElement;
    expect(within(ghs).getByText(/^Checked with Paystack on /)).toBeInTheDocument();
    expect(within(ghs).getByRole("button", { name: "Remove GHS" })).toBeInTheDocument();
    expect(within(ngn).queryByRole("button")).toBeNull();
  });

  it("does not show the panel for an inactive gateway", () => {
    h.configs = [{ gateway: "paystack", public_key: "pk_live_1234567890abcdef", is_active: false, currencies: [] }];
    render(<GatewaysSection />);
    expect(screen.queryByRole("list", { name: "Currencies on your Paystack account" })).toBeNull();
  });

  it("offers ISO currencies not already usable, and adds one Paystack confirms", async () => {
    connected([]);
    h.verify.mockResolvedValue({
      success: true,
      data: { gateway: "paystack", currencies: [{ code: "KES", verified_at: "2026-09-30T10:00:00.000Z", verified_via: "paystack_balance" }] },
    });
    const user = userEvent.setup();
    render(<GatewaysSection />);
    await user.click(screen.getByRole("button", { name: "+ Add a currency" }));
    const values = Array.from(
      (screen.getByRole("combobox", { name: "providerCurrency" }) as HTMLSelectElement).options,
    ).map((o) => o.value);
    expect(values).toContain("KES");
    expect(values).not.toContain("NGN");
    await user.selectOptions(screen.getByRole("combobox", { name: "providerCurrency" }), "KES");
    await user.click(screen.getByRole("button", { name: "Check and add" }));
    expect(h.verify).toHaveBeenCalledWith({ gateway: "paystack", code: "KES" });
    expect(toast.success).toHaveBeenCalledWith("KES added. You can price membership plans in it now.");
    expect(screen.queryByRole("button", { name: "Check and add" })).toBeNull();
  });

  it.each([
    ["PROVIDER_CURRENCY_NOT_ON_ACCOUNT", 400, "Your Paystack account doesn't have KES enabled. Enable it with Paystack, then try again."],
    ["PROVIDER_CURRENCY_UNKNOWN", 400, "KES isn't a currency we recognise."],
    ["PROVIDER_CURRENCY_UNSUPPORTED", 400, "Paystack can't charge KES, so it can't be added."],
    ["PROVIDER_CURRENCY_BLOCKED", 400, "KES can't be used with your own Paystack account right now."],
    ["PROVIDER_ACCOUNT_MISSING", 400, "Connect your Paystack account first."],
    ["GATEWAY_NOT_SUPPORTED", 400, "That payment provider's currencies can't be checked yet."],
  ])("shows the server's message for %s", async (code, status, message) => {
    h.verify.mockResolvedValue({ success: false, status, code, message });
    await addCurrency("KES");
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("shows plain copy when Paystack couldn't be asked (502, message hidden in production)", async () => {
    h.verify.mockResolvedValue({
      success: false,
      status: 502,
      code: "PROVIDER_ACCOUNT_CHECK_FAILED",
      message: "Internal server error",
    });
    await addCurrency("KES");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't reach Paystack to check your account. Try again.",
    );
  });

  it("removes a currency nothing depends on", async () => {
    h.remove.mockResolvedValue({ success: true, data: { gateway: "paystack", currencies: [] } });
    const user = userEvent.setup();
    render(<GatewaysSection />);
    await user.click(screen.getByRole("button", { name: "Remove GHS" }));
    expect(h.remove).toHaveBeenCalledWith({ gateway: "paystack", code: "GHS" });
    expect(toast.success).toHaveBeenCalledWith("GHS removed.");
  });

  it("shows what depends on a currency when removing it is refused", async () => {
    h.remove.mockResolvedValue({
      success: false,
      status: 409,
      code: "CURRENCY_LOCKED",
      message: "GHS is only payable through your own account. Before you remove GHS, move 2 active plan(s) priced in GHS to another currency or deactivate them.",
      details: { locked_by: { GHS: { live_plans: 2, pending_payments: 1 } } },
    });
    const user = userEvent.setup();
    render(<GatewaysSection />);
    await user.click(screen.getByRole("button", { name: "Remove GHS" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Before you remove GHS");
    expect(alert).toHaveTextContent("Depends on GHS: 2 active plans and 1 payment in progress.");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("asks before removing, and does nothing when the provider cancels", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<GatewaysSection />);
    await user.click(screen.getByRole("button", { name: "Remove GHS" }));
    expect(h.remove).not.toHaveBeenCalled();
  });

  it("re-checks with Paystack and says what was removed and what is missing but kept", async () => {
    h.refresh.mockResolvedValue({
      success: true,
      data: { gateway: "paystack", currencies: [GHS_VERIFIED], removed: ["KES"], missing_on_account: ["GHS"] },
    });
    const user = userEvent.setup();
    render(<GatewaysSection />);
    await user.click(screen.getByRole("button", { name: "Check again with Paystack" }));
    expect(h.refresh).toHaveBeenCalledWith("paystack");
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Removed KES: no longer enabled on your Paystack account.");
    expect(status).toHaveTextContent("GHS is no longer enabled on your Paystack account, but plans or payments still use it.");
  });

  it("says when every currency still checks out", async () => {
    h.refresh.mockResolvedValue({
      success: true,
      data: { gateway: "paystack", currencies: [GHS_VERIFIED], removed: [], missing_on_account: [] },
    });
    const user = userEvent.setup();
    render(<GatewaysSection />);
    await user.click(screen.getByRole("button", { name: "Check again with Paystack" }));
    expect(screen.getByRole("status")).toHaveTextContent("Every currency is still enabled on your Paystack account.");
  });

  it("shows plain copy when the re-check can't reach Paystack", async () => {
    h.refresh.mockResolvedValue({ success: false, status: 502, code: "PROVIDER_ACCOUNT_CHECK_FAILED", message: "" });
    const user = userEvent.setup();
    render(<GatewaysSection />);
    await user.click(screen.getByRole("button", { name: "Check again with Paystack" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't reach Paystack to check your account. Try again.",
    );
  });
});

describe("provider currency plumbing", () => {
  it("folds a top-level locked_by into details", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          statusCode: 409,
          code: "CURRENCY_LOCKED",
          message: "GHS is only payable through your own account.",
          locked_by: { GHS: { live_plans: 1, pending_payments: 0 } },
        }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    );
    const res = await apiClient.delete("/marketplace/organizations/o/payment-config/paystack/currencies/GHS");
    expect(providerCurrencyLocks(res)).toEqual({ GHS: { live_plans: 1, pending_payments: 0 } });
    fetchMock.mockRestore();
  });

  it("calls the currency endpoints with the org, gateway and code", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      success: true,
      data: { gateway: "paystack", currencies: [{ code: "ghs", verified_at: "x", verified_via: "paystack_balance" }], removed: [], missing_on_account: ["kes"] },
    });
    const del = vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true, data: { gateway: "paystack", currencies: [] } });
    const added = await marketplaceService.verifyProviderCurrency("o1", "paystack", "GHS");
    expect(post).toHaveBeenCalledWith("/marketplace/organizations/o1/payment-config/paystack/currencies", { code: "GHS" });
    expect(added.data).toEqual({ gateway: "paystack", currencies: [{ code: "GHS", verified_at: "x", verified_via: "paystack_balance" }] });
    const checked = await marketplaceService.refreshProviderCurrencies("o1", "paystack");
    expect(post).toHaveBeenLastCalledWith("/marketplace/organizations/o1/payment-config/paystack/currencies/refresh");
    expect(checked.data?.missing_on_account).toEqual(["KES"]);
    await marketplaceService.removeProviderCurrency("o1", "paystack", "GHS");
    expect(del).toHaveBeenCalledWith("/marketplace/organizations/o1/payment-config/paystack/currencies/GHS");
    post.mockRestore();
    del.mockRestore();
  });

  it("reads a payment-config row from an API without currencies as none", () => {
    expect(normalizePaymentConfig({ gateway: "Paystack", public_key: "pk", is_active: true })).toEqual({
      gateway: "paystack",
      public_key: "pk",
      is_active: true,
      currencies: [],
    });
  });

  it("normalises price-currencies rows; a missing flag is not selectable", () => {
    const rows = normalizeOrgPriceCurrencies([
      { code: "ghs", name: "Ghanaian Cedi", symbol: "GH₵", minor_unit: 2, selectable: true, route: "provider", reasons: [], payable: { card: { selectable: true, route: "provider" } }, provider_verified: true },
      { code: "EUR", route: "platform" },
      { code: "nope" },
    ]);
    expect(rows.map((r) => [r.code, r.selectable, r.route])).toEqual([
      ["GHS", true, "provider"],
      ["EUR", false, null],
    ]);
    expect(rows[0].payable.bank_transfer).toEqual({ selectable: false, route: null });
  });

  it("labels provider-route options and keeps a saved currency visible", () => {
    const list = [orgPrice("NGN"), orgPrice("GHS", { name: "Ghanaian Cedi", symbol: "GH₵", route: "provider" }), orgPrice("EUR", { selectable: false })];
    expect(orgPriceOptions(list, "EUR", "Your Paystack account")).toEqual([
      { label: "NGN, NGN", value: "NGN" },
      { label: "GHS · GH₵, Ghanaian Cedi (Your Paystack account)", value: "GHS" },
      { label: "EUR (not available for new prices)", value: "EUR" },
    ]);
  });

  it("describes locks and hides 5xx copy", () => {
    expect(describeCurrencyLock({ live_plans: 1, pending_payments: 0 })).toBe("1 active plan");
    expect(describeCurrencyLock({ live_plans: 0, pending_payments: 3 })).toBe("3 payments in progress");
    expect(providerCurrencyMessage({ status: 503, message: "Paystack exploded" }, "Paystack")).toBe(
      "We couldn't reach Paystack to check your account. Try again.",
    );
  });
});
