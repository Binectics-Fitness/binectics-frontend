import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/lib/api/client";
import { memberPaymentsService, normalizeOwed } from "@/lib/api/memberPayments";
import { owedFailureCopy, paymentStatus, renewHrefFor } from "@/lib/memberPayments/helpers";

const ok = (data: unknown) => ({ success: true as const, data });

describe("memberPaymentsService", () => {
  const get = vi.spyOn(apiClient, "get");
  const post = vi.spyOn(apiClient, "post");
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("builds the history query from the filters and maps the page", async () => {
    get.mockResolvedValue(
      ok({
        items: [
          {
            id: "t1",
            kind: "session",
            description: "Check-in",
            provider: { id: null, name: "Coach Ada" },
            amount_minor: 1500000,
            currency: "ngn",
            status: "paid",
            paid_at: "2026-10-05T10:00:00.000Z",
            method: "bank_transfer",
            reference: null,
            receipt_available: true,
            refund: { state: "full", refunded_minor: 1500000 },
          },
        ],
        next_cursor: "C1",
      }),
    );
    const res = await memberPaymentsService.list({ limit: 20, cursor: "C0", kind: "session", currency: "NGN" });
    expect(get).toHaveBeenCalledWith("/transactions/me?limit=20&cursor=C0&kind=session&currency=NGN");
    expect(res.data?.nextCursor).toBe("C1");
    expect(res.data?.items[0]).toMatchObject({
      currency: "NGN",
      amountMinor: 1500000,
      method: "bank_transfer",
      reference: null,
      refund: { state: "full", refundedMinor: 1500000 },
    });
  });

  it("sends no query string for an unfiltered history", async () => {
    get.mockResolvedValue(ok({ items: [], next_cursor: null }));
    await memberPaymentsService.list();
    expect(get).toHaveBeenCalledWith("/transactions/me");
  });

  it("reads totals per currency", async () => {
    get.mockResolvedValue(
      ok({ by_currency: [{ currency: "NGN", paid_minor: 5, refunded_minor: 2, net_minor: 3 }] }),
    );
    const res = await memberPaymentsService.summary();
    expect(res.data).toEqual([{ currency: "NGN", paidMinor: 5, refundedMinor: 2, netMinor: 3 }]);
  });

  it("sends no amount when opening a checkout, and refuses a reply without an access code", async () => {
    post.mockResolvedValue(ok({ reference: "mbr_1", access_code: "AC", amount_minor: 100, currency: "ngn" }));
    const res = await memberPaymentsService.checkout("sub 1");
    expect(post).toHaveBeenCalledWith("/member-billing/charges/sub%201/checkout", {});
    expect(res.data).toMatchObject({ accessCode: "AC", amountMinor: 100, currency: "NGN" });
    post.mockResolvedValue(ok({ reference: "mbr_1" }));
    expect((await memberPaymentsService.checkout("s")).data).toBeNull();
  });

  it("reads an unknown gateway word as no answer, never as paid", async () => {
    post.mockResolvedValue(ok({ charge: { id: "s", state: "payable" }, verification: { gateway_status: "weird" } }));
    const res = await memberPaymentsService.verify("s");
    expect(res.data?.gatewayStatus).toBeNull();
    expect(res.data?.charge.state).toBe("payable");
  });

  it("never offers an unknown state for payment", () => {
    expect(normalizeOwed({ id: "s", state: "something-new", amount_minor: 5, currency: "ngn" }).state).toBe("closed");
  });
});

describe("member payment helpers", () => {
  it("words a refund by how much came back", () => {
    expect(paymentStatus({ status: "paid", refund: { state: "none", refundedMinor: 0 } }).label).toBe("Paid");
    expect(paymentStatus({ status: "paid", refund: { state: "partial", refundedMinor: 1 } }).label).toBe("Part refunded");
    expect(paymentStatus({ status: "paid", refund: { state: "full", refundedMinor: 1 } }).label).toBe("Refunded");
    expect(paymentStatus({ status: "refund", refund: { state: "none", refundedMinor: 0 } }).label).toBe("Refund");
  });

  it("only treats definite gateway answers as failures to show", () => {
    expect(owedFailureCopy("failed")).toMatch(/not been charged/);
    expect(owedFailureCopy("mismatch")).toMatch(/does not match/);
    expect(owedFailureCopy("pending")).toBeNull();
    expect(owedFailureCopy("success")).toBeNull();
    expect(owedFailureCopy(null)).toBeNull();
  });

  it("only links a renewal that has a listing to pay through", () => {
    const renewal = normalizeOwed({
      id: "s",
      state: "payable",
      pay_via: "renewal_checkout",
      renewal: { listing_id: null, plan_id: "P" },
    });
    expect(renewHrefFor(renewal)).toBeNull();
  });
});
