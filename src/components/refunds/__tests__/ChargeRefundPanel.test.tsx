import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/setup/test-utils";
import { ChargeRefundPanel } from "../ChargeRefundPanel";
import { DisputeDetail } from "../DisputeDetail";
import type { ChargeRefundQuote, Dispute } from "@/lib/api/refunds";

const svc = {
  orgQuote: vi.fn(),
  adminQuote: vi.fn(),
  orgRefund: vi.fn(),
  orgRequest: vi.fn(),
  adminRefund: vi.fn(),
  adminDispute: vi.fn(),
  orgDispute: vi.fn(),
  requestEvidence: vi.fn(),
  adminNote: vi.fn(),
  addEvidence: vi.fn(),
  uploadEvidenceDocument: vi.fn(),
};
vi.mock("@/lib/api/refunds", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/refunds")>()),
  refundsService: new Proxy({}, { get: (_t, k: string) => (svc as Record<string, unknown>)[k] }),
}));

const quote = (over: Partial<ChargeRefundQuote> = {}): ChargeRefundQuote => ({
  charge: {
    id: "tx1", type: "consultation", amount_minor: 1_000_000, currency: "NGN",
    occurred_at: "2026-10-01T10:00:00Z", reference_type: "consultation_booking",
    reference_id: "b1", member_user_id: "m1",
  },
  payment_rail: "provider",
  action: "refund",
  refundable_minor: 1_000_000,
  refunded_minor: 0,
  refunds: [],
  ...over,
});
const refund = { id: "r1", amount_minor: 1_000_000, currency: "NGN", status: "pending" };

describe("ChargeRefundPanel", () => {
  beforeEach(() => Object.values(svc).forEach((f) => f.mockReset()));

  it("own-key money: the provider refunds it, in minor units, with one key reused across a retry", async () => {
    svc.orgQuote.mockResolvedValue({ success: true, data: quote() });
    svc.orgRefund
      .mockResolvedValueOnce({ success: false, message: "Network error" })
      .mockResolvedValueOnce({ success: true, data: refund });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    expect(await screen.findByText(/your own Paystack account/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Full amount" }));
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    // Trying again goes through the confirmation again, under the same key.
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    await screen.findByRole("status");
    const [a, b] = svc.orgRefund.mock.calls;
    expect(a[0]).toBe("o1");
    expect(a[2]).toMatchObject({ amount_minor: 1_000_000 });
    // Same key on the retry: the API returns the same refund, never a second.
    expect(b[2].idempotency_key).toBe(a[2].idempotency_key);
  });

  it("platform money: the provider can only ask, and must say why", async () => {
    svc.orgQuote.mockResolvedValue({ success: true, data: quote({ payment_rail: "platform", action: "request" }) });
    svc.orgRequest.mockResolvedValue({ success: true, data: { ...refund, status: "requested" } });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    const ask = await screen.findByRole("button", { name: "Ask Binectics to refund" });
    await userEvent.click(screen.getByRole("button", { name: "Full amount" }));
    await userEvent.click(ask);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Say why/);
    expect(svc.orgRequest).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole("textbox", { name: /Why should Binectics/ }), "Trainer was ill");
    await userEvent.click(ask);
    expect(svc.orgRequest).toHaveBeenCalled();
    expect(svc.orgRefund).not.toHaveBeenCalled();
  });

  it("admin looking at own-key money gets no form", async () => {
    svc.adminQuote.mockResolvedValue({ success: true, data: quote({ action: "none" }) });
    renderWithProviders(<ChargeRefundPanel mode="admin" chargeId="tx1" />);
    expect(await screen.findByText(/Only the provider can refund it/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Refund" })).toBeNull();
  });

  it("never sends more than is left", async () => {
    svc.orgQuote.mockResolvedValue({ success: true, data: quote({ refundable_minor: 100_000 }) });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    const input = await screen.findByRole("textbox", { name: "Refund amount" });
    await userEvent.type(input, "5000");
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/more than/);
    expect(svc.orgRefund).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});

describe("ChargeRefundPanel: a direct refund asks first (owner ruling 6)", () => {
  beforeEach(() => Object.values(svc).forEach((f) => f.mockReset()));

  async function openForm() {
    svc.orgQuote.mockResolvedValue({ success: true, data: quote() });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" payerName="Ada Obi" />);
    await screen.findByText(/your own Paystack account/);
    await userEvent.click(screen.getByRole("button", { name: "Full amount" }));
  }

  it("names the amount and the member, and sends nothing until confirmed", async () => {
    svc.orgRefund.mockResolvedValue({ success: true, data: refund });
    await openForm();
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog.textContent).toMatch(/to Ada Obi\?/);
    expect(dialog.textContent).toMatch(/your own Paystack account/);
    expect(svc.orgRefund).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(svc.orgRefund).not.toHaveBeenCalled();
  });

  it("a double click opens one confirmation and sends exactly one refund", async () => {
    svc.orgRefund.mockResolvedValue({ success: true, data: refund });
    await openForm();
    await userEvent.dblClick(screen.getByRole("button", { name: "Refund" }));
    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    await userEvent.dblClick(screen.getByRole("button", { name: /^Refund .+/ }));
    await screen.findByRole("status");
    expect(svc.orgRefund).toHaveBeenCalledTimes(1);
  });

  it("two clicks on the form in one tick still open one confirmation and send once", async () => {
    svc.orgRefund.mockResolvedValue({ success: true, data: refund });
    await openForm();
    const form = screen.getByRole("button", { name: "Refund" }).closest("form")!;
    // Both submits land before React renders the confirmation.
    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    const confirm = screen.getByRole("button", { name: /^Refund .+/ });
    act(() => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    await screen.findByRole("status");
    expect(svc.orgRefund).toHaveBeenCalledTimes(1);
  });

  it("confirming again after a failed send reuses the key taken at the first submit", async () => {
    svc.orgRefund
      .mockResolvedValueOnce({ success: false, message: "Network error" })
      .mockResolvedValueOnce({ success: false, message: "Network error" })
      .mockResolvedValueOnce({ success: true, data: refund });
    await openForm();
    for (let i = 0; i < 3; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Refund" }));
      await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
      await waitFor(() => expect(svc.orgRefund).toHaveBeenCalledTimes(i + 1));
    }
    await screen.findByRole("status");
    const keys = svc.orgRefund.mock.calls.map((c) => c[2].idempotency_key);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toEqual(expect.any(String));
  });

  it("after a refusal (4xx), changing the amount or reason takes a new key", async () => {
    svc.orgRefund
      .mockResolvedValueOnce({ success: false, code: "REFUND_EXCEEDS_REMAINING", message: "Too much", status: 400 })
      .mockResolvedValueOnce({ success: false, code: "REFUND_DISPUTE_OPEN", message: "Disputed", status: 409 })
      .mockResolvedValueOnce({ success: true, data: refund });
    await openForm();
    const send = async () => {
      await userEvent.click(screen.getByRole("button", { name: "Refund" }));
      await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    };
    await send();
    await waitFor(() => expect(svc.orgRefund).toHaveBeenCalledTimes(1));
    // Change the reason: a different refund, so a different key.
    await userEvent.type(screen.getByRole("textbox", { name: /Reason/ }), "Class cancelled");
    await send();
    await waitFor(() => expect(svc.orgRefund).toHaveBeenCalledTimes(2));
    // Unchanged form after a refusal: retrying keeps that key.
    await send();
    await waitFor(() => expect(svc.orgRefund).toHaveBeenCalledTimes(3));
    const keys = svc.orgRefund.mock.calls.map((c) => c[2].idempotency_key);
    expect(keys[1]).not.toBe(keys[0]);
    expect(keys[2]).toBe(keys[1]);
  });

  it("after a network failure, editing the form keeps the key (the refund may exist)", async () => {
    svc.orgRefund
      .mockResolvedValueOnce({ success: false, message: "Network error" })
      .mockResolvedValueOnce({ success: true, data: refund });
    await openForm();
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    await waitFor(() => expect(svc.orgRefund).toHaveBeenCalledTimes(1));
    await userEvent.type(screen.getByRole("textbox", { name: /Reason/ }), "x");
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    await waitFor(() => expect(svc.orgRefund).toHaveBeenCalledTimes(2));
    const [a, b] = svc.orgRefund.mock.calls;
    expect(b[2].idempotency_key).toBe(a[2].idempotency_key);
  });

  it("a new refund after a successful one gets a new key", async () => {
    svc.orgRefund.mockResolvedValue({ success: true, data: { ...refund, amount_minor: 100 } });
    await openForm();
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    await screen.findByRole("status");
    await userEvent.click(screen.getByRole("button", { name: "Full amount" }));
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    await waitFor(() => expect(svc.orgRefund).toHaveBeenCalledTimes(2));
    const [a, b] = svc.orgRefund.mock.calls;
    expect(b[2].idempotency_key).not.toBe(a[2].idempotency_key);
  });

  it("an admin refund of platform money sends without the provider's confirmation", async () => {
    svc.adminQuote.mockResolvedValue({ success: true, data: quote({ payment_rail: "platform" }) });
    svc.adminRefund.mockResolvedValue({ success: true, data: refund });
    renderWithProviders(<ChargeRefundPanel mode="admin" chargeId="tx1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Full amount" }));
    await userEvent.dblClick(screen.getByRole("button", { name: "Refund" }));
    await screen.findByRole("status");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(svc.adminRefund).toHaveBeenCalledTimes(1);
  });
});

const dispute = (over: Partial<Dispute> = {}): Dispute => ({
  id: "d1", gateway_dispute_id: "358950", charge_transaction_id: "tx1", organization_id: "o1",
  member_user_id: "m1", reference_type: null, reference_id: null, payment_rail: "provider",
  handled_by: "provider", can_act: false, open: true, gateway_status: "awaiting-merchant-feedback",
  category: "chargeback", resolution: null, refund_amount_minor: 5800, currency: "NGN",
  due_at: "2026-11-25T18:00:00Z", resolved_at: null, evidence_requested_at: null,
  evidence_request_note: null, evidence: [], events: [], created_at: null, updated_at: null,
  ...over,
});

describe("DisputeDetail", () => {
  beforeEach(() => Object.values(svc).forEach((f) => f.mockReset()));

  it("admins see a provider's own-key dispute but cannot act on it", async () => {
    svc.adminDispute.mockResolvedValue({ success: true, data: dispute() });
    renderWithProviders(<DisputeDetail mode="admin" disputeId="d1" />);
    expect(await screen.findByText(/the provider handles this dispute/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Ask the provider/ })).toBeNull();
  });

  it("admins ask the provider for evidence on platform disputes", async () => {
    svc.adminDispute.mockResolvedValue({ success: true, data: dispute({ handled_by: "platform", payment_rail: "platform", can_act: true }) });
    svc.requestEvidence.mockResolvedValue({ success: true, data: dispute({ handled_by: "platform", can_act: true, evidence_request_note: "Attendance log" }) });
    renderWithProviders(<DisputeDetail mode="admin" disputeId="d1" />);
    await userEvent.type(await screen.findByRole("textbox"), "Attendance log");
    await userEvent.click(screen.getByRole("button", { name: "Ask the provider for evidence" }));
    expect(svc.requestEvidence).toHaveBeenCalledWith("d1", "Attendance log");
    expect(await screen.findByText(/Binectics asked for: Attendance log/)).toBeTruthy();
  });

  it("providers upload a private document and attach its reference", async () => {
    svc.orgDispute.mockResolvedValue({ success: true, data: dispute({ handled_by: "platform", payment_rail: "platform" }) });
    svc.uploadEvidenceDocument.mockResolvedValue({ success: true, data: { url: "https://res.cloudinary.com/x/raw/authenticated/v1/users/u/disputes/evidence/a_pdf" } });
    svc.addEvidence.mockResolvedValue({ success: true, data: dispute({ evidence: [{ at: "2026-10-12T10:00:00Z", by_role: "provider", by_user_id: "u", note: "log", document_url: "https://signed" }] }) });
    renderWithProviders(<DisputeDetail mode="provider" orgId="o1" disputeId="d1" />);
    const fileInput = (await screen.findByLabelText(/Document/)) as HTMLInputElement;
    await userEvent.upload(fileInput, new File(["%PDF"], "log.pdf", { type: "application/pdf" }));
    await userEvent.type(screen.getByRole("textbox"), "log");
    await userEvent.click(screen.getByRole("button", { name: "Add evidence" }));
    expect(svc.addEvidence).toHaveBeenCalledWith("o1", "d1", {
      note: "log",
      document_url: "https://res.cloudinary.com/x/raw/authenticated/v1/users/u/disputes/evidence/a_pdf",
    });
    expect(await screen.findByRole("link", { name: "View document" })).toBeTruthy();
  });
});

describe("ChargeRefundPanel and open disputes", () => {
  beforeEach(() => Object.values(svc).forEach((f) => f.mockReset()));

  it("explains the 409 REFUND_DISPUTE_OPEN refusal and keeps the form for later", async () => {
    svc.orgQuote.mockResolvedValue({ success: true, data: quote() });
    svc.orgRefund.mockResolvedValue({ success: false, status: 409, code: "REFUND_DISPUTE_OPEN", message: "disputed" });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Full amount" }));
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Refund .+/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/disputed this payment with their bank/);
  });

  it("a lost chargeback shows as refunded and leaves nothing to refund", async () => {
    svc.orgQuote.mockResolvedValue({
      success: true,
      data: quote({ refundable_minor: 0, refunded_minor: 1_000_000, action: "none" }),
    });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    expect(await screen.findByText(/Nothing left to refund/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Refund" })).toBeNull();
  });
});
