import { describe, expect, it } from "vitest";
import {
  adherenceCountTones,
  attentionTone,
  bookingPaymentStateTone,
  bookingStatusTone,
  instanceStatusTone,
  invoiceStatusTone,
  membershipStatusTone,
  paymentStatusTone,
  recordStateTone,
  requestStatusTone,
  sentTaskTone,
  subscriptionStatusTone,
  taskStatusTone,
  templateStatusTone,
} from "./statusTones";
import { TONES, TONE_COLORS, providerTone, toneColors } from "./tones";

describe("tone set", () => {
  it("gives every tone a fill and an ink from the design tokens, never a raw colour", () => {
    for (const tone of TONES) {
      expect(TONE_COLORS[tone].fill).toMatch(/^var\(--[\w-]+\)$/);
      expect(TONE_COLORS[tone].ink).toMatch(/^var\(--[\w-]+\)$/);
    }
  });

  it("draws success with signal, warn with the warn pair and trainer with its readable ink", () => {
    expect(TONE_COLORS.success).toEqual({ fill: "var(--signal-soft)", ink: "var(--signal-ink)" });
    expect(TONE_COLORS.warn).toEqual({ fill: "var(--warn-soft)", ink: "var(--warn-ink)" });
    expect(TONE_COLORS.trainer.ink).toBe("var(--trainer-ink)");
  });

  it("falls back to neutral for a missing tone", () => {
    expect(toneColors(undefined)).toEqual(TONE_COLORS.neutral);
  });

  it("maps every spelling of a provider kind to its role accent", () => {
    expect(providerTone("gym")).toBe("gym");
    expect(providerTone("gym_owner")).toBe("gym");
    expect(providerTone("GYM")).toBe("gym");
    expect(providerTone("personal_trainer")).toBe("trainer");
    expect(providerTone("Trainer")).toBe("trainer");
    expect(providerTone("dietitian")).toBe("dietitian");
    expect(providerTone("fitness_member")).toBe("neutral");
    expect(providerTone(undefined)).toBe("neutral");
  });
});

describe("bookingStatusTone", () => {
  it("is success for confirmed and completed, sessions and classes alike", () => {
    expect(bookingStatusTone("CONFIRMED")).toBe("success");
    expect(bookingStatusTone("COMPLETED")).toBe("success");
    expect(bookingStatusTone("confirmed")).toBe("success");
  });
  it("is warn for a no-show or a hold awaiting payment", () => {
    expect(bookingStatusTone("NO_SHOW")).toBe("warn");
    expect(bookingStatusTone("PENDING", { awaitingPayment: true })).toBe("warn");
  });
  it("never paints a cancellation red", () => {
    expect(bookingStatusTone("CANCELLED")).toBe("neutral");
    expect(bookingStatusTone("cancelled_by_gym")).toBe("neutral");
    expect(bookingStatusTone("waitlisted")).toBe("neutral");
    expect(bookingStatusTone("PENDING")).toBe("neutral");
    expect(bookingStatusTone(undefined)).toBe("neutral");
  });
});

describe("bookingPaymentStateTone", () => {
  it("follows the member's view of a booking", () => {
    expect(bookingPaymentStateTone("awaiting_payment")).toBe("warn");
    expect(bookingPaymentStateTone("no_show")).toBe("warn");
    expect(bookingPaymentStateTone("confirmed")).toBe("success");
    expect(bookingPaymentStateTone("completed")).toBe("success");
    expect(bookingPaymentStateTone("expired")).toBe("neutral");
    expect(bookingPaymentStateTone("cancelled")).toBe("neutral");
    expect(bookingPaymentStateTone("pending")).toBe("neutral");
  });
});

describe("program tones", () => {
  it("tones a task by what happened to it", () => {
    expect(taskStatusTone("done")).toBe("success");
    expect(taskStatusTone("missed")).toBe("warn");
    expect(taskStatusTone("skipped")).toBe("neutral");
    expect(taskStatusTone("pending")).toBe("neutral");
  });
  it("tones an instance: paused needs watching, cancelled is just an ending", () => {
    expect(instanceStatusTone("active")).toBe("success");
    expect(instanceStatusTone("completed")).toBe("success");
    expect(instanceStatusTone("paused")).toBe("warn");
    expect(instanceStatusTone("assigned")).toBe("neutral");
    expect(instanceStatusTone("cancelled")).toBe("neutral");
  });
  it("only colours an adherence count above zero", () => {
    expect(adherenceCountTones({ done: 0, missed: 0 })).toEqual({
      done: "neutral",
      missed: "neutral",
      skipped: "neutral",
      pending: "neutral",
    });
    expect(adherenceCountTones({ done: 3, missed: 1 })).toMatchObject({ done: "success", missed: "warn" });
  });
  it("tones a needs-you row", () => {
    expect(attentionTone("form_submitted")).toBe("success");
    expect(attentionTone("tasks_missed")).toBe("warn");
    expect(attentionTone("something_new")).toBe("neutral");
  });
  it("marks a sent task warn once it is missed or open past its due day", () => {
    const today = "2026-10-04";
    expect(sentTaskTone({ status: "done", due_date: "2026-10-01" }, today)).toBe("success");
    expect(sentTaskTone({ status: "missed", due_date: "2026-10-01" }, today)).toBe("warn");
    expect(sentTaskTone({ status: "skipped", due_date: "2026-10-01" }, today)).toBe("neutral");
    expect(sentTaskTone({ status: "pending", due_date: "2026-10-03" }, today)).toBe("warn");
    expect(sentTaskTone({ status: "pending", due_date: today }, today)).toBe("neutral");
    expect(sentTaskTone({ status: "pending", due_date: "2026-10-09" }, today)).toBe("neutral");
  });
  it("calls a published template ready", () => {
    expect(templateStatusTone("published")).toBe("success");
    expect(templateStatusTone("draft")).toBe("neutral");
    expect(templateStatusTone("archived")).toBe("neutral");
  });
});

describe("money and membership tones", () => {
  it("tones a gym membership", () => {
    expect(membershipStatusTone("active")).toBe("success");
    expect(membershipStatusTone("pending_payment")).toBe("warn");
    expect(membershipStatusTone("past_due")).toBe("danger");
    expect(membershipStatusTone("suspended")).toBe("danger");
    expect(membershipStatusTone("paused")).toBe("neutral");
    expect(membershipStatusTone("expired")).toBe("neutral");
    expect(membershipStatusTone("cancelled")).toBe("neutral");
    expect(membershipStatusTone("dormant")).toBe("neutral");
  });
  it("tones a platform subscription and its invoices", () => {
    expect(subscriptionStatusTone("active")).toBe("success");
    expect(subscriptionStatusTone("trialing")).toBe("neutral");
    expect(subscriptionStatusTone("pending_payment")).toBe("warn");
    expect(subscriptionStatusTone("past_due")).toBe("danger");
    expect(subscriptionStatusTone("cancelled")).toBe("neutral");
    expect(invoiceStatusTone("paid")).toBe("success");
    expect(invoiceStatusTone("open")).toBe("warn");
    expect(invoiceStatusTone("uncollectible")).toBe("danger");
    expect(invoiceStatusTone("void")).toBe("neutral");
  });
  it("tones a payment transaction", () => {
    expect(paymentStatusTone("succeeded")).toBe("success");
    expect(paymentStatusTone("pending")).toBe("warn");
    expect(paymentStatusTone("failed")).toBe("danger");
    expect(paymentStatusTone("reversed")).toBe("neutral");
  });
  it("tones a connection request", () => {
    expect(requestStatusTone("accepted")).toBe("success");
    expect(requestStatusTone("pending")).toBe("warn");
    expect(requestStatusTone("declined")).toBe("danger");
    expect(requestStatusTone("expired")).toBe("neutral");
    expect(requestStatusTone("cancelled")).toBe("neutral");
  });
  it("tones a record's live state", () => {
    expect(recordStateTone("live")).toBe("success");
    expect(recordStateTone("waiting")).toBe("warn");
    expect(recordStateTone("blocked")).toBe("danger");
    expect(recordStateTone("off")).toBe("neutral");
  });
});
