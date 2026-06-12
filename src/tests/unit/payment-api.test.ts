import { afterEach, describe, expect, it } from "vitest";

import { getPaymentGateway, formatPrice } from "@/lib/api/payment";
import { PaymentGateway } from "@/lib/types";

const ORIGINAL_ENV = {
  paystack: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  flutterwave: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
};

afterEach(() => {
  if (ORIGINAL_ENV.paystack === undefined) {
    delete process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  } else {
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = ORIGINAL_ENV.paystack;
  }

  if (ORIGINAL_ENV.flutterwave === undefined) {
    delete process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  } else {
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY = ORIGINAL_ENV.flutterwave;
  }
});

describe("payment api helpers", () => {
  it("uses stripe for non-african currencies", () => {
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = "pk_test";
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY = "flw_test";

    expect(getPaymentGateway("usd")).toBe(PaymentGateway.STRIPE);
  });

  it("uses paystack first for supported african currencies", () => {
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = "pk_test";
    delete process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

    expect(getPaymentGateway("NGN")).toBe(PaymentGateway.PAYSTACK);
    expect(getPaymentGateway("kes")).toBe(PaymentGateway.PAYSTACK);
  });

  it("falls back to flutterwave when paystack is unavailable", () => {
    delete process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY = "flw_test";

    expect(getPaymentGateway("ZAR")).toBe(PaymentGateway.FLUTTERWAVE);
  });

  it("falls back to stripe if no african gateway keys are configured", () => {
    delete process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

    expect(getPaymentGateway("NGN")).toBe(PaymentGateway.STRIPE);
  });

  it("formats prices with currency symbols", () => {
    const usd = formatPrice(1200, "usd");
    const ngn = formatPrice(45500, "ngn");

    expect(usd).toMatch(/\$/);
    expect(usd).not.toContain("USD");
    expect(ngn).toContain("₦");
  });
});
