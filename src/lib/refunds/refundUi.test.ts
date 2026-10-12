import { describe, expect, it } from "vitest";
import {
  REFUND_ORIGIN_LABEL,
  REFUND_STATUS,
  adminRequestActions,
  disputeTone,
  newIdempotencyKey,
  refundAmountError,
  refundErrorMessage,
} from "./refundUi";
import type { RefundStatus } from "@/lib/api/refunds";

describe("refundUi", () => {
  it("labels every status the API can return", () => {
    const all: RefundStatus[] = [
      "requested", "rejected", "queued", "sending", "pending",
      "needs_attention", "unknown", "processed", "failed",
    ];
    for (const s of all) expect(REFUND_STATUS[s].label).toBeTruthy();
    expect(REFUND_STATUS.processed.tone).toBe("success");
    expect(REFUND_STATUS.unknown.tone).toBe("danger");
  });

  it("validates amounts in minor units against what is left", () => {
    expect(refundAmountError(null, 1000)).toMatch(/Enter an amount/);
    expect(refundAmountError(0, 1000)).toMatch(/above zero/);
    expect(refundAmountError(12.5, 1000)).toMatch(/above zero/);
    expect(refundAmountError(1001, 1000)).toMatch(/more than/);
    expect(refundAmountError(1000, 1000)).toBeNull();
  });

  it("makes a new key each time, safe for the API's pattern", () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,100}$/);
  });

  it("tells a won dispute from a lost one", () => {
    expect(disputeTone({ open: true, resolution: null }).label).toBe("Open");
    expect(disputeTone({ open: false, resolution: "auto-accepted" }).label).toBe("Lost");
    expect(disputeTone({ open: false, resolution: "declined" }).label).toBe("Won");
  });

  it("explains authority refusals in plain words", () => {
    expect(refundErrorMessage("REFUND_REQUEST_REQUIRED")).toMatch(/ask Binectics/);
    expect(refundErrorMessage("REFUND_NOT_COLLECTOR")).toMatch(/only they can refund/);
    expect(refundErrorMessage("REFUND_DISPUTE_OPEN")).toMatch(/disputed this payment/);
    expect(refundErrorMessage("X", "server said")).toBe("server said");
  });
});

describe("admin request actions (owner rulings, Oct 4 and 12)", () => {
  it("platform requests: approve and decline", () => {
    expect(adminRequestActions({ payment_rail: "platform", origin: "provider_request", status: "requested" })).toEqual({
      approve: true,
      decline: true,
      onProviderKey: false,
    });
  });

  it("a suspended provider's own-key request: approvable, sent from their account", () => {
    expect(adminRequestActions({ payment_rail: "provider", origin: "provider_suspension", status: "requested" })).toEqual({
      approve: true,
      decline: true,
      onProviderKey: true,
    });
  });

  it("other own-key requests (a suspended member's): decline only", () => {
    expect(adminRequestActions({ payment_rail: "provider", origin: "member_suspension", status: "requested" })).toEqual({
      approve: false,
      decline: true,
      onProviderKey: false,
    });
  });

  it("nothing once decided", () => {
    expect(adminRequestActions({ payment_rail: "platform", origin: "provider_request", status: "queued" }).approve).toBe(false);
  });

  it("names every origin the API sends", () => {
    for (const o of ["provider_suspension", "member_suspension", "late_payment", "gym_cancellation"] as const) {
      expect(REFUND_ORIGIN_LABEL[o]).toMatch(/\w/);
    }
  });
});
