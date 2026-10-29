import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentBuyPanel } from "@/components/content/ContentBuyPanel";
import { paidContentService, type ContentPurchase } from "@/lib/api/paidContent";
import { openPaystackCheckout } from "@/lib/payments/paystackInline";

vi.mock("@/lib/payments/paystackInline", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/payments/paystackInline")>()),
  openPaystackCheckout: vi.fn(),
}));

const purchase = (status: string): ContentPurchase => ({
  id: "pu1",
  itemKind: "program",
  itemId: "prog1",
  itemName: "Strength Base",
  amountMinor: 1500000,
  currency: "NGN",
  status,
  reference: "itm_1",
  expiresAt: null,
  paidAt: null,
  refundedAt: null,
});
const ok = <T,>(data: T) => ({ success: true as const, data });
const prices = [{ currency: "NGN", amountMinor: 1500000 }];

describe("ContentBuyPanel", () => {
  const checkout = vi.spyOn(paidContentService, "checkout");
  const verify = vi.spyOn(paidContentService, "verify");
  const getPurchase = vi.spyOn(paidContentService, "getPurchase");
  const open = vi.mocked(openPaystackCheckout);

  beforeEach(() => {
    checkout.mockReset();
    verify.mockReset();
    getPurchase.mockReset();
    open.mockReset();
    checkout.mockResolvedValue(
      ok({
        purchase: purchase("pending"),
        payment: { reference: "itm_1", accessCode: "AC_1", authorizationUrl: null, amountMinor: 1500000, currency: "NGN", expiresAt: null },
      }),
    );
  });

  it("labels the button with the item's own price", () => {
    render(<ContentBuyPanel kind="program" itemId="prog1" prices={prices} onUnlocked={() => {}} />);
    expect(screen.getByRole("button", { name: "Buy for ₦15,000" })).toBeInTheDocument();
  });

  it("hands Paystack only the access code and never trusts the popup callback", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "itm_1" });
    verify.mockResolvedValue(ok({ purchase: purchase("paid"), gatewayStatus: "success" }));
    const onUnlocked = vi.fn();
    render(<ContentBuyPanel kind="program" itemId="prog1" prices={prices} onUnlocked={onUnlocked} />);
    await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
    expect(checkout).toHaveBeenCalledWith("program", "prog1", "NGN");
    expect(open.mock.calls[0]).toEqual(["AC_1"]);
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    expect(verify).toHaveBeenCalledWith("pu1");
  });

  it("does not unlock when the popup says success but the API says pending, and reports a failed charge", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "itm_1" });
    verify.mockResolvedValue(ok({ purchase: purchase("pending"), gatewayStatus: "failed" }));
    const onUnlocked = vi.fn();
    render(<ContentBuyPanel kind="program" itemId="prog1" prices={prices} onUnlocked={onUnlocked} />);
    await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/did not go through/);
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it("re-reads the purchase when the popup is closed without paying", async () => {
    open.mockResolvedValue({ closed: "dismissed" });
    getPurchase.mockResolvedValue(ok(purchase("pending")));
    const onUnlocked = vi.fn();
    render(<ContentBuyPanel kind="program" itemId="prog1" prices={prices} onUnlocked={onUnlocked} />);
    await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
    await waitFor(() => expect(getPurchase).toHaveBeenCalledWith("pu1"));
    expect(verify).not.toHaveBeenCalled();
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^Buy for/ })).toBeEnabled();
  });

  it("says why when the API refuses the checkout", async () => {
    checkout.mockResolvedValue({ success: false, code: "CONTENT_NO_SEAT", message: "" });
    render(<ContentBuyPanel kind="program" itemId="prog1" prices={prices} onUnlocked={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/haven't been charged/);
    expect(open).not.toHaveBeenCalled();
  });

  it("lets the buyer pick among the item's own currencies", async () => {
    render(
      <ContentBuyPanel
        kind="meal_plan"
        itemId="m1"
        prices={[...prices, { currency: "USD", amountMinor: 1000 }]}
        onUnlocked={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /USD/ }));
    expect(screen.getByRole("button", { name: "Buy for $10" })).toBeInTheDocument();
    open.mockResolvedValue({ closed: "dismissed" });
    getPurchase.mockResolvedValue(ok(purchase("pending")));
    await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
    expect(checkout).toHaveBeenCalledWith("meal_plan", "m1", "USD");
  });
});
