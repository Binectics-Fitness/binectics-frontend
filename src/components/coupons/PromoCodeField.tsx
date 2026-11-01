"use client";

import { useState } from "react";
import { formatMinor } from "@/lib/currencies/helpers";
import { couponErrorMessage } from "@/lib/coupons/couponUi";
import type { CouponQuote } from "@/lib/api/coupons";
import type { ApiResponse } from "@/lib/types";

interface PromoCodeFieldProps {
  /** Asks the API to price the code. Redeems nothing. */
  validate: (code: string) => Promise<ApiResponse<CouponQuote>>;
  /** Called with the priced quote, or null when the code is removed. */
  onChange: (quote: CouponQuote | null) => void;
  quote: CouponQuote | null;
  disabled?: boolean;
}

/**
 * "Have a code?": one code per purchase. The server prices it; this only
 * shows what the server said. Applying redeems nothing, paying does.
 */
export function PromoCodeField({ validate, onChange, quote, disabled }: PromoCodeFieldProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    const text = code.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    const res = await validate(text);
    setBusy(false);
    if (res.success && res.data) {
      onChange(res.data);
      setCode("");
    } else {
      setError(couponErrorMessage(res));
    }
  };

  if (quote) {
    return (
      <div className="rounded-(--r-2) px-3.5 py-3 text-[13.5px]" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }} data-testid="promo-applied">
        <div className="flex items-center justify-between gap-3">
          <span style={{ color: "var(--ink)" }}>
            <span className="font-mono text-[12px] uppercase tracking-[0.04em]">{quote.code}</span> applied
          </span>
          <button
            type="button"
            className="text-[12.5px] underline"
            style={{ color: "var(--fg-3)" }}
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setError(null);
            }}
          >
            Remove
          </button>
        </div>
        <div className="mt-1 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          {quote.free
            ? "This code covers the whole price."
            : `You save ${formatMinor(quote.currency, quote.discount_minor)}.`}
          {quote.floored ? " The payment gateway's minimum charge limits the discount." : ""}
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="text-[13px] underline" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(true)} disabled={disabled}>
        Have a code?
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="promo-code" className="text-[13px]" style={{ color: "var(--ink)" }}>
        Discount code
      </label>
      <div className="flex gap-2">
        <input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 20))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
          autoCapitalize="characters"
          autoComplete="off"
          disabled={disabled || busy}
          className="flex-1 rounded-(--r-2) px-3 py-2 text-[14px] uppercase"
          style={{ border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--ink)" }}
        />
        <button type="button" className="btn-ghost-v2" onClick={() => void apply()} disabled={disabled || busy || !code.trim()}>
          {busy ? "Checking..." : "Apply"}
        </button>
      </div>
      {error && (
        <div role="alert" className="text-[12.5px]" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
