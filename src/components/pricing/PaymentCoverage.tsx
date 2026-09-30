"use client";

import { useCurrencyList } from "@/lib/queries/currencies";
import { gatewayCurrencySummary } from "@/lib/currencies/helpers";

/**
 * Which payment providers we run and the currencies each can charge right
 * now, from GET /currencies ("Paystack: NGN"). Fees are the gateway's and
 * are shown at checkout, so none are quoted here.
 */
export function PaymentCoverage() {
  const { data: list, isPending, isError } = useCurrencyList();
  const rows = gatewayCurrencySummary(list);

  if (isPending) {
    return (
      <p className="text-[14px] mt-6" style={{ color: "var(--fg-3)" }} aria-busy="true">
        Loading payment providers
      </p>
    );
  }
  if (isError || rows.length === 0) {
    return (
      <p className="text-[14.5px] leading-[1.55] mt-6 max-w-[56ch]" style={{ color: "var(--fg-2)" }}>
        The currencies you can be paid in are listed in your dashboard when you set a price. Gateway fees are shown at checkout.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
      {rows.map((r) => (
        <div
          key={r.gateway}
          className="flex flex-col gap-2 rounded-(--r-3)"
          style={{ padding: "18px 20px", border: "1px solid var(--border)", background: "var(--bg)" }}
        >
          <strong className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{r.label}</strong>
          <div className="font-mono text-[12px] break-words" style={{ color: "var(--fg-2)" }}>
            {r.label}: {r.codes.join(", ")}
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            Fees shown at checkout
          </div>
        </div>
      ))}
    </div>
  );
}
