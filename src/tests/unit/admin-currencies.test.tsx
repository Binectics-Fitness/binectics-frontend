import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminCurrenciesPage from "@/app/admin/currencies/page";
import { adminService, type AdminCurrency } from "@/lib/api/admin";
import { currencyPatch, describeInFlight, draftOf } from "@/lib/currencies/adminCurrency";
import { UserRole } from "@/lib/types";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/currencies",
}));
const auth = vi.hoisted(() => ({
  user: { id: "a1", role: "ADMIN", is_admin: true, first_name: "Ada", last_name: "Admin" } as Record<string, unknown> | null,
  isLoading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const on = { selectable: true, reasons: [] };
const offReasons = (...messages: string[]) => ({
  selectable: false,
  reasons: messages.map((message, i) => ({ code: `r${i}`, message })),
});

function row(over: Partial<AdminCurrency> & Pick<AdminCurrency, "code" | "name">): AdminCurrency {
  return {
    symbol: over.code,
    minor_unit: 2,
    platform_enabled: true,
    notes: null,
    effective: { price: on, charge_card: on, charge_transfer: on, provider_billing: on },
    gateways: [
      { gateway: "paystack", label: "Paystack", capable: true, capable_methods: ["card", "bank_transfer"], account_enabled: true, methods: ["card"] },
    ],
    usage: {
      live: { organizations: 12, session_types: 12, plans: 7, listings: 3 },
      in_flight: { pending_bookings: 0, pending_subscriptions: 0, pending_provider_checkouts: 0 },
      historical: { transactions: 40 },
      in_flight_total: 0,
    },
    updated_by: null,
    updated_at: null,
    ...over,
  };
}

const NGN = row({ code: "NGN", name: "Nigerian Naira", symbol: "₦" });
const GHS = row({
  code: "GHS",
  name: "Ghanaian Cedi",
  symbol: "GH₵",
  effective: {
    price: offReasons("Paystack can charge GHS, but it isn't enabled on our account"),
    charge_card: offReasons("Paystack can charge GHS, but it isn't enabled on our account"),
    charge_transfer: offReasons(
      "Paystack can charge GHS, but it isn't enabled on our account",
      "Bank transfer isn't available in GHS",
    ),
    provider_billing: offReasons("Paystack can charge GHS, but it isn't enabled on our account"),
  },
  gateways: [
    { gateway: "paystack", label: "Paystack", capable: true, capable_methods: ["card"], account_enabled: false, methods: ["card"] },
  ],
});
const EUR = row({
  code: "EUR",
  name: "Euro",
  symbol: "€",
  platform_enabled: false,
  effective: {
    price: offReasons("Turned off on the platform", "No payment provider we use can charge EUR"),
    charge_card: offReasons("Turned off on the platform"),
    charge_transfer: offReasons("Turned off on the platform"),
    provider_billing: offReasons("Turned off on the platform"),
  },
  gateways: [
    { gateway: "paystack", label: "Paystack", capable: false, capable_methods: [], account_enabled: false, methods: [] },
  ],
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminCurrenciesPage />
    </QueryClientProvider>,
  );
}

/** The shell renders its body for desktop and phone; use the first copy. */
async function firstRow(code: string) {
  const edit = await screen.findAllByRole("button", { name: `Edit ${code}` });
  return edit[0].closest("tr") as HTMLTableRowElement;
}

describe("admin currencies page", () => {
  const list = vi.spyOn(adminService, "listCurrencies");
  const update = vi.spyOn(adminService, "updateCurrency");

  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = { id: "a1", role: "ADMIN", is_admin: true, first_name: "Ada", last_name: "Admin" };
    list.mockResolvedValue({ success: true, data: [NGN, GHS, EUR] });
  });

  it("shows each use's status and why it is off", async () => {
    renderPage();
    const ghs = await firstRow("GHS");
    expect(within(ghs).getAllByText(/Paystack can charge GHS, but it isn't enabled on our account/).length).toBeGreaterThan(0);
    // The transfer column carries a second reason behind the first.
    expect(within(ghs).getByText(/\(\+1\)/)).toBeInTheDocument();
    expect(within(ghs).getByLabelText(/Transfer off: .*Bank transfer isn't available in GHS/)).toBeInTheDocument();
    expect(within(ghs).getByText(/not on our account/)).toBeInTheDocument();
    const ngn = await firstRow("NGN");
    expect(within(ngn).getAllByText("On")).toHaveLength(4);
  });

  it("lists enabled currencies by default and all of them on request, with search", async () => {
    const user = userEvent.setup();
    renderPage();
    await firstRow("NGN");
    expect(screen.queryAllByText("Euro")).toHaveLength(0);
    await user.click(screen.getAllByRole("button", { name: /^All/ })[0]);
    expect(screen.getAllByText("Euro").length).toBeGreaterThan(0);
    await user.type(screen.getAllByLabelText("Search currencies")[0], "ced");
    expect(screen.queryAllByText("Euro")).toHaveLength(0);
    expect(screen.getAllByText("Ghanaian Cedi").length).toBeGreaterThan(0);
  });

  it("saves only what changed with PATCH", async () => {
    const user = userEvent.setup();
    update.mockResolvedValue({ success: true, data: { ...GHS, gateways: [{ ...GHS.gateways[0], account_enabled: true }] } });
    renderPage();
    const ghs = await firstRow("GHS");
    await user.click(within(ghs).getByRole("button", { name: "Edit GHS" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("switch", { name: "Enabled on our account" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith("GHS", { gateways: [{ gateway: "paystack", account_enabled: true }] });
  });

  it("offers only the methods the provider can collect in that currency", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(within(await firstRow("GHS")).getByRole("button", { name: "Edit GHS" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("checkbox", { name: "Card" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("checkbox", { name: "Bank transfer" })).toBeNull();
  });

  it("asks before stopping new payments when payments are in flight, then resends with stop_new_payments", async () => {
    const user = userEvent.setup();
    update
      .mockResolvedValueOnce({
        success: false,
        status: 409,
        code: "CURRENCY_IN_USE",
        message: "NGN has 3 payment(s) in progress.",
        details: {
          in_flight: { pending_bookings: 2, pending_subscriptions: 1, pending_provider_checkouts: 0 },
          uses_lost: ["price", "charge_card"],
        },
      })
      .mockResolvedValueOnce({ success: true, data: { ...NGN, platform_enabled: false } });
    renderPage();
    await user.click(within(await firstRow("NGN")).getByRole("button", { name: "Edit NGN" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("switch", { name: "Offered on the platform" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    const warning = await within(dialog).findByRole("alert");
    expect(warning).toHaveTextContent("2 held bookings, 1 pending membership");
    expect(warning).toHaveTextContent("prices, card");
    expect(update).toHaveBeenNthCalledWith(1, "NGN", { platform_enabled: false });

    await user.click(within(dialog).getByRole("button", { name: "Stop new payments now" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update).toHaveBeenNthCalledWith(2, "NGN", { platform_enabled: false, stop_new_payments: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("shows the server's reason when a change is refused", async () => {
    const user = userEvent.setup();
    update.mockResolvedValue({
      success: false,
      status: 400,
      code: "VALIDATION_FAILED",
      message: "Paystack can't collect bank transfers in GHS",
    });
    renderPage();
    await user.click(within(await firstRow("GHS")).getByRole("button", { name: "Edit GHS" }));
    const dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Notes"));
    await user.type(within(dialog).getByLabelText("Notes"), "Waiting on Paystack");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Paystack can't collect bank transfers in GHS");
  });

  it("sends a non-admin back to their own dashboard and shows nothing", async () => {
    auth.user = { id: "u1", role: UserRole.USER, is_admin: false };
    renderPage();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/member"));
    expect(screen.queryByRole("heading", { name: "Currencies" })).toBeNull();
    expect(screen.queryByText("GHS")).toBeNull();
  });
});

describe("currencyPatch", () => {
  it("is empty when nothing changed", () => {
    expect(currencyPatch(GHS, draftOf(GHS))).toEqual({});
  });

  it("sends changed fields only, with notes cleared to null", () => {
    const d = draftOf({ ...NGN, notes: "old" });
    d.name = " Naira ";
    d.notes = "";
    d.gateways.paystack.methods = ["card", "bank_transfer"];
    expect(currencyPatch({ ...NGN, notes: "old" }, d)).toEqual({
      name: "Naira",
      notes: null,
      gateways: [{ gateway: "paystack", methods: ["card", "bank_transfer"] }],
    });
  });
});

describe("describeInFlight", () => {
  it("names each kind of payment in progress", () => {
    expect(describeInFlight({ pending_bookings: 1, pending_subscriptions: 0, pending_provider_checkouts: 3 })).toBe(
      "1 held booking, 3 provider checkouts",
    );
    expect(describeInFlight(undefined)).toBe("");
  });
});
