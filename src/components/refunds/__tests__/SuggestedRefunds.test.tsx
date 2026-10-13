import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/setup/test-utils";
import { SuggestedRefunds } from "../SuggestedRefunds";
import { RefundRow } from "../ChargeRefundPanel";
import { promptPill } from "@/lib/refunds/refundUi";
import type { Refund } from "@/lib/api/refunds";

const svc = {
  orgRefunds: vi.fn(),
  orgRefundSuggested: vi.fn(),
  orgDismissSuggested: vi.fn(),
};
vi.mock("@/lib/api/refunds", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/refunds")>()),
  refundsService: new Proxy({}, { get: (_t, k: string) => (svc as Record<string, unknown>)[k] }),
}));

function suggested(over: Partial<Refund> = {}): Refund {
  return {
    id: "r1",
    charge_transaction_id: "tx1",
    organization_id: "o1",
    member_user_id: "m1",
    reference_type: "consultation_booking",
    reference_id: "b1",
    payment_rail: "provider",
    amount_minor: 1_250_000,
    currency: "NGN",
    status: "rejected",
    origin: "member_suspension",
    reason: "Session cancelled: the member was suspended by Binectics",
    gateway_refund_id: null,
    gateway_status: null,
    needs_review: false,
    decision_note: "Paid to the gym's own account",
    decided_at: "2026-10-13T10:00:00Z",
    processed_at: null,
    failed_at: null,
    last_error: null,
    created_at: "2026-10-12T10:00:00Z",
    updated_at: "2026-10-13T10:00:00Z",
    history: [],
    provider_prompt: { status: "open", prompted_at: "2026-10-13T10:00:00Z", resolved_at: null, refund_id: null, note: null },
    member: { id: "m1", first_name: "Ada", last_name: "Member", email: null },
    ...over,
  };
}
const page = (items: Refund[]) => ({ success: true, data: { items, total: items.length, page: 1, limit: 25 } });

describe("SuggestedRefunds", () => {
  beforeEach(() => Object.values(svc).forEach((f) => f.mockReset()));

  it("asks only for open suggestions, and shows nothing when there are none", async () => {
    svc.orgRefunds.mockResolvedValue(page([]));
    const { container } = renderWithProviders(<SuggestedRefunds orgId="o1" />);
    await waitFor(() => expect(svc.orgRefunds).toHaveBeenCalledWith("o1", { provider_prompt: "open" }));
    expect(container.textContent).toBe("");
  });

  it("explains why, with the member and amount, and highlights the linked one", async () => {
    svc.orgRefunds.mockResolvedValue(page([suggested(), suggested({ id: "r2", member: null })]));
    renderWithProviders(<SuggestedRefunds orgId="o1" highlightId="r2" />);
    expect(await screen.findByRole("heading", { name: "Refunds to send yourself" })).toBeTruthy();
    expect(screen.getByText(/your own Paystack account, so\s+Binectics couldn.t refund it/)).toBeTruthy();
    expect(screen.getByText(/Ada Member/)).toBeTruthy();
    expect(screen.getAllByText("₦12,500")).toHaveLength(2);
    expect(screen.getByText("2 suggested")).toBeTruthy();
    const rows = screen.getAllByRole("listitem");
    expect(rows[1].getAttribute("data-highlighted")).toBe("true");
    expect(rows[0].getAttribute("data-highlighted")).toBeNull();
    // No em dashes in what the provider reads.
    expect(document.body.textContent).not.toContain(String.fromCharCode(0x2014));
  });

  it("Refund sends it on the provider's key with one key reused across a retry, then reloads", async () => {
    svc.orgRefunds.mockResolvedValueOnce(page([suggested()])).mockResolvedValue(page([]));
    svc.orgRefundSuggested
      .mockResolvedValueOnce({ success: false, message: "Network error" })
      .mockResolvedValueOnce({ success: true, data: { ...suggested(), id: "r9", status: "pending", origin: "provider" } });
    const onChanged = vi.fn();
    renderWithProviders(<SuggestedRefunds orgId="o1" onChanged={onChanged} />);
    await userEvent.click(await screen.findByRole("button", { name: "Refund ₦12,500 to Ada Member" }));
    const confirm = await screen.findByRole("button", { name: "Refund ₦12,500" });
    await userEvent.click(confirm);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Network error/);
    await userEvent.click(screen.getByRole("button", { name: "Refund ₦12,500" }));
    expect(await screen.findByRole("status")).toHaveProperty("textContent", "Refund of ₦12,500 started.");
    const [a, b] = svc.orgRefundSuggested.mock.calls;
    expect(a[0]).toBe("o1");
    expect(a[1]).toBe("r1");
    expect(a[2].idempotency_key).toBeTruthy();
    // The same key on the retry: the API returns the same refund, never two.
    expect(b[2].idempotency_key).toBe(a[2].idempotency_key);
    expect(onChanged).toHaveBeenCalled();
    expect(svc.orgRefunds).toHaveBeenCalledTimes(2);
  });

  it("a refund Paystack refuses says so and leaves the suggestion listed", async () => {
    svc.orgRefunds.mockResolvedValue(page([suggested()]));
    svc.orgRefundSuggested.mockResolvedValue({ success: true, data: { ...suggested(), id: "r9", status: "failed" } });
    renderWithProviders(<SuggestedRefunds orgId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: /^Refund ₦12,500 to/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Refund ₦12,500" }));
    expect((await screen.findByRole("status")).textContent).toMatch(/Paystack refused the refund/);
    expect(screen.getByRole("button", { name: /^Refund ₦12,500 to/ })).toBeTruthy();
  });

  it("Dismiss sends the optional note and the row goes away", async () => {
    svc.orgRefunds.mockResolvedValueOnce(page([suggested()])).mockResolvedValue(page([]));
    svc.orgDismissSuggested.mockResolvedValue({ success: true, data: suggested() });
    renderWithProviders(<SuggestedRefunds orgId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: /Dismiss the suggested refund/ }));
    await userEvent.type(screen.getByRole("textbox", { name: /Why not/ }), "Not owed");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect((await screen.findByRole("status")).textContent).toMatch(/Dismissed/);
    expect(svc.orgDismissSuggested).toHaveBeenCalledWith("o1", "r1", "Not owed");
    expect(screen.queryByRole("button", { name: /Dismiss the suggested refund/ })).toBeNull();
    expect(svc.orgRefundSuggested).not.toHaveBeenCalled();
  });

  it("an already-answered suggestion shows the API's plain message", async () => {
    svc.orgRefunds.mockResolvedValue(page([suggested()]));
    svc.orgDismissSuggested.mockResolvedValue({
      success: false,
      code: "REFUND_INVALID_STATE",
      message: "This payment has already been refunded.",
    });
    renderWithProviders(<SuggestedRefunds orgId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: /Dismiss the suggested refund/ }));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect((await screen.findByRole("alert")).textContent).toBe("This payment has already been refunded.");
  });
});

describe("a suggested refund in the refunds list", () => {
  it("reads as the prompt, not as a declined request", () => {
    const open = renderWithProviders(<ul><RefundRow refund={suggested()} /></ul>);
    expect(open.getByText("Refund suggested")).toBeTruthy();
    expect(open.queryByText("Declined")).toBeNull();
    open.unmount();
    expect(promptPill(suggested({ provider_prompt: { status: "refunded", prompted_at: null, resolved_at: null, refund_id: "r9", note: null } }))?.label).toBe(
      "Refunded by you",
    );
    expect(promptPill(suggested({ provider_prompt: { status: "dismissed", prompted_at: null, resolved_at: null, refund_id: null, note: null } }))?.label).toBe(
      "Dismissed",
    );
    expect(promptPill(suggested({ provider_prompt: null }))).toBeNull();
    const other = renderWithProviders(<ul><RefundRow refund={suggested({ provider_prompt: null, origin: "provider_request" })} /></ul>);
    expect(other.getByText("Declined")).toBeTruthy();
  });
});
