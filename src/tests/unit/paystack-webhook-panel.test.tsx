import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GatewaysSection } from "@/components/provider/GatewaysSection";
import { paystackKeyMode, webhookReceivedLabel } from "@/components/provider/PaystackWebhookPanel";
import { normalizePaymentConfig } from "@/lib/api/marketplace";

/**
 * Settings → Payments, Paystack webhook guidance: a connected Paystack
 * account shows the exact webhook URL from the API with a Copy button, the
 * steps to paste it into the matching Test or Live field in the provider's
 * own Paystack dashboard, why it matters, and when one last arrived.
 */

const URL = "https://api.example.com/webhooks/paystack";

const h = vi.hoisted(() => ({
  configs: [] as unknown[],
}));

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "org-1" } }),
}));
vi.mock("@/lib/queries/marketplace", () => ({
  useOrgPaymentConfigs: () => ({ data: h.configs, isLoading: false }),
  useUpsertPaymentConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePaymentConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useVerifyProviderCurrency: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveProviderCurrency: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRefreshProviderCurrencies: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  usePaymentGateways: () => ({
    data: [{ gateway: "paystack", label: "Paystack", provider_keys_supported: true, currencies: ["NGN"] }],
    isSuccess: true,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
  useOrgPriceCurrencies: () => ({ data: [], isLoading: false, isError: false, providerHint: "Your Paystack account" }),
}));

const paystack = (over: Record<string, unknown> = {}) => ({
  gateway: "paystack",
  public_key: "pk_test_abcdefghijklmnop",
  is_active: true,
  currencies: [],
  webhook_url: URL,
  webhook_last_received_at: null,
  ...over,
});

const panel = () => screen.getByRole("region", { name: "Paystack webhook" });

describe("Paystack webhook panel", () => {
  beforeEach(() => {
    h.configs = [];
  });

  it("shows the exact URL, and Copy puts it on the clipboard", async () => {
    h.configs = [paystack()];
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<GatewaysSection />);

    expect(within(panel()).getByTestId("paystack-webhook-url")).toHaveTextContent(URL);
    await user.click(within(panel()).getByRole("button", { name: "Copy" }));
    expect(write).toHaveBeenCalledWith(URL);
    expect(within(panel()).getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(within(panel()).getByRole("status")).toHaveTextContent("Webhook URL copied.");
  });

  it("says so when the clipboard is blocked, leaving the URL to select", async () => {
    h.configs = [paystack()];
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<GatewaysSection />);

    await user.click(within(panel()).getByRole("button", { name: "Copy" }));
    expect(within(panel()).getByRole("status")).toHaveTextContent(/couldn.t copy it/i);
    expect(within(panel()).getByTestId("paystack-webhook-url")).toHaveTextContent(URL);
  });

  it("gives numbered steps naming the Test field for test keys, and why it matters", () => {
    h.configs = [paystack()];
    render(<GatewaysSection />);

    const steps = within(panel()).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("Settings, then API Keys & Webhooks");
    expect(steps[1]).toHaveTextContent("Test Webhook URL");
    expect(steps[2]).toHaveTextContent(/save/i);
    expect(panel()).toHaveTextContent(/renewals and refunds confirm instantly/i);
    expect(panel()).toHaveTextContent(/about 25 minutes/i);
  });

  it("names the Live field for live keys", () => {
    h.configs = [paystack({ public_key: "pk_live_abcdefghijklmnop" })];
    render(<GatewaysSection />);
    expect(within(panel()).getAllByRole("listitem")[1]).toHaveTextContent("Live Webhook URL");
  });

  it('shows "Not received yet" until one arrives', () => {
    h.configs = [paystack()];
    render(<GatewaysSection />);
    expect(within(panel()).getAllByText(/not received yet/i).length).toBeGreaterThan(0);
    expect(panel()).not.toHaveTextContent(/last received/i);
  });

  it("shows when the last one arrived", () => {
    const at = "2026-10-13T09:30:00.000Z";
    h.configs = [paystack({ webhook_last_received_at: at })];
    render(<GatewaysSection />);
    expect(panel()).toHaveTextContent(`Last received ${webhookReceivedLabel(at)}.`);
    expect(within(panel()).getByText("Receiving")).toBeInTheDocument();
    expect(panel()).not.toHaveTextContent(/not received yet/i);
  });

  it("explains, without a Copy button, when the API has no URL to give", () => {
    h.configs = [paystack({ webhook_url: null })];
    render(<GatewaysSection />);
    expect(panel()).toHaveTextContent(/can.t show your webhook URL right now/i);
    expect(within(panel()).queryByRole("button", { name: "Copy" })).toBeNull();
  });

  it("is absent for an older API, an inactive config, or another gateway", () => {
    const older: Record<string, unknown> = paystack();
    delete older.webhook_url;
    delete older.webhook_last_received_at;
    h.configs = [older];
    const { unmount } = render(<GatewaysSection />);
    expect(screen.queryByRole("region", { name: "Paystack webhook" })).toBeNull();
    unmount();

    h.configs = [paystack({ is_active: false })];
    const second = render(<GatewaysSection />);
    expect(screen.queryByRole("region", { name: "Paystack webhook" })).toBeNull();
    second.unmount();

    h.configs = [paystack({ gateway: "stripe" })];
    render(<GatewaysSection />);
    expect(screen.queryByRole("region", { name: "Paystack webhook" })).toBeNull();
  });
});

describe("webhook helpers", () => {
  it("reads the key mode from the public key", () => {
    expect(paystackKeyMode("pk_test_x")).toBe("Test");
    expect(paystackKeyMode("PK_LIVE_x")).toBe("Live");
    expect(paystackKeyMode("something")).toBeNull();
  });

  it("formats a received time, and nothing for a bad one", () => {
    expect(webhookReceivedLabel(null)).toBeNull();
    expect(webhookReceivedLabel("not a date")).toBeNull();
    expect(webhookReceivedLabel("2026-10-13T09:30:00.000Z")).toMatch(/2026/);
  });
});

describe("normalizePaymentConfig webhook fields", () => {
  const base = { gateway: "paystack", public_key: "pk_test_x", is_active: true };

  it("keeps an https URL and a valid time", () => {
    const c = normalizePaymentConfig({ ...base, webhook_url: URL, webhook_last_received_at: "2026-10-13T09:30:00Z" });
    expect(c?.webhook_url).toBe(URL);
    expect(c?.webhook_last_received_at).toBe("2026-10-13T09:30:00Z");
  });

  it("drops anything that isn't an https URL or a real time", () => {
    const c = normalizePaymentConfig({
      ...base,
      webhook_url: "javascript:alert(1)",
      webhook_last_received_at: "yesterday",
    });
    expect(c?.webhook_url).toBeNull();
    expect(c?.webhook_last_received_at).toBeNull();
    expect(normalizePaymentConfig({ ...base, webhook_url: "http://x.test/webhooks/paystack" })?.webhook_url).toBeNull();
  });

  it("leaves the fields out when an older API doesn't send them", () => {
    const c = normalizePaymentConfig(base);
    expect(c).not.toHaveProperty("webhook_url");
    expect(c).not.toHaveProperty("webhook_last_received_at");
  });
});
