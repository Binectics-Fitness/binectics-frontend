import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentBuyPanel } from "@/components/content/ContentBuyPanel";
import { paidContentService, type ContentPurchase } from "@/lib/api/paidContent";
import { openPaystackCheckout } from "@/lib/payments/paystackInline";

// A fast poll so the loop can run for real: 3 re-reads, 15 ms apart.
vi.mock("@/lib/paidContent/helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/paidContent/helpers")>()),
  PURCHASE_POLL_MS: 15,
  PURCHASE_POLL_LIMIT: 3,
}));
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
    await userEvent.click(screen.getByRole("button", { name: /USD/ }));
    expect(screen.getByRole("button", { name: "Buy for $10" })).toBeInTheDocument();
    open.mockResolvedValue({ closed: "dismissed" });
    getPurchase.mockResolvedValue(ok(purchase("pending")));
    await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
    expect(checkout).toHaveBeenCalledWith("meal_plan", "m1", "USD");
  });

  it("marks the chosen currency as pressed, and falls back when the prices change under it", async () => {
    const both = [...prices, { currency: "USD", amountMinor: 1000 }];
    const { rerender } = render(<ContentBuyPanel kind="meal_plan" itemId="m1" prices={both} onUnlocked={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /USD/ }));
    expect(screen.getByRole("button", { name: /USD/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /NGN/ })).toHaveAttribute("aria-pressed", "false");
    rerender(<ContentBuyPanel kind="meal_plan" itemId="m1" prices={prices} onUnlocked={() => {}} />);
    open.mockResolvedValue({ closed: "dismissed" });
    getPurchase.mockResolvedValue(ok(purchase("pending")));
    await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
    expect(checkout).toHaveBeenLastCalledWith("meal_plan", "m1", "NGN");
  });

  describe("after the popup", () => {
    const pay = async (onUnlocked = vi.fn()) => {
      open.mockResolvedValue({ closed: "callback", reference: "itm_1" });
      const view = render(<ContentBuyPanel kind="program" itemId="prog1" prices={prices} onUnlocked={onUnlocked} />);
      await userEvent.click(screen.getByRole("button", { name: /^Buy for/ }));
      return { ...view, onUnlocked };
    };

    it("says reversed and error charges honestly", async () => {
      verify.mockResolvedValue(ok({ purchase: purchase("pending"), gatewayStatus: "reversed" }));
      await pay();
      expect(await screen.findByRole("alert")).toHaveTextContent(/was reversed/);
    });

    it("uses the one currency label, not the code and the symbol", () => {
      render(
        <ContentBuyPanel kind="meal_plan" itemId="m1" prices={[...prices, { currency: "USD", amountMinor: 1000 }]} onUnlocked={() => {}} />,
      );
      expect(screen.getByRole("button", { name: "NGN ₦15,000" })).toHaveTextContent(/^₦15,000$/);
    });

    it("ends as 'still confirming' when the purchase never settles, and can check again", async () => {
      verify.mockResolvedValue(ok({ purchase: purchase("pending"), gatewayStatus: "pending" }));
      getPurchase.mockResolvedValue(ok(purchase("pending")));
      const { onUnlocked } = await pay();
      expect(await screen.findByText(/still being confirmed/)).toBeInTheDocument();
      expect(getPurchase).toHaveBeenCalledTimes(3);
      expect(onUnlocked).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Check again" })).toBeEnabled();
    });

    it("unlocks when a later re-read says paid", async () => {
      verify.mockResolvedValue(ok({ purchase: purchase("pending"), gatewayStatus: "pending" }));
      getPurchase.mockResolvedValueOnce(ok(purchase("pending"))).mockResolvedValue(ok(purchase("paid")));
      const { onUnlocked } = await pay();
      await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
      expect(getPurchase).toHaveBeenCalledTimes(2);
    });

    it("stops polling and lets the buyer retry when the purchase dies", async () => {
      verify.mockResolvedValue(ok({ purchase: purchase("pending"), gatewayStatus: "pending" }));
      getPurchase.mockResolvedValue(ok(purchase("expired")));
      const { onUnlocked } = await pay();
      expect(await screen.findByRole("alert")).toHaveTextContent(/not completed/);
      expect(getPurchase).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: /^Buy for/ })).toBeEnabled();
      expect(onUnlocked).not.toHaveBeenCalled();
    });

    it("does nothing more once unmounted mid-poll", async () => {
      verify.mockResolvedValue(ok({ purchase: purchase("pending"), gatewayStatus: "pending" }));
      let release: () => void = () => {};
      getPurchase.mockImplementation(
        () => new Promise((resolve) => { release = () => resolve(ok(purchase("paid"))); }),
      );
      const { onUnlocked, unmount } = await pay();
      // A re-read is in flight; the panel goes away; the answer arrives late.
      await waitFor(() => expect(getPurchase).toHaveBeenCalledTimes(1));
      unmount();
      release();
      await new Promise((r) => setTimeout(r, 80));
      expect(onUnlocked).not.toHaveBeenCalled();
      expect(getPurchase).toHaveBeenCalledTimes(1);
    });
  });
});
