"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ds/Drawer";
import { AsyncSpinner } from "@/components/ds";
import { memberPaymentsService, type MemberReceipt } from "@/lib/api/memberPayments";
import { formatMinor } from "@/lib/currencies/helpers";
import { KIND_LABEL, METHOD_LABEL } from "@/lib/memberPayments/helpers";
import { formatDate } from "@/utils/format";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; receipt: MemberReceipt };

/**
 * One payment's receipt, as the API issues it. No fees or tax lines are
 * invented here: the receipt shows the amount paid and nothing the API did
 * not send.
 */
export function ReceiptDrawer({ paymentId, onClose }: { paymentId: string | null; onClose: () => void }) {
  return (
    <Drawer open={!!paymentId} onClose={onClose} title="Receipt" width={440}>
      {paymentId && <ReceiptBody key={paymentId} paymentId={paymentId} />}
    </Drawer>
  );
}

function ReceiptBody({ paymentId }: { paymentId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await memberPaymentsService.receipt(paymentId);
      if (!active) return;
      setState(res.success && res.data ? { kind: "ready", receipt: res.data } : { kind: "error" });
    })();
    return () => {
      active = false;
    };
  }, [paymentId, attempt]);

  if (state.kind === "loading") return <AsyncSpinner />;
  if (state.kind === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
          We couldn&apos;t load this receipt.
        </p>
        <button
          type="button"
          className="btn-ghost-v2"
          onClick={() => {
            setState({ kind: "loading" });
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const r = state.receipt;
  const refunded = r.refund.state !== "none";
  return (
    <article className="flex flex-col gap-5" data-testid="receipt">
      <div>
        <p className="font-mono text-[11px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>
          Receipt · {refunded ? (r.refund.state === "full" ? "refunded" : "part refunded") : "paid"}
        </p>
        <h2 className="text-[22px] font-medium mt-1.5" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
          {r.receiptNumber}
        </h2>
        <p className="font-mono text-[11.5px] mt-1" style={{ color: "var(--fg-3)" }}>
          {formatDate(r.paidAt)}
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-4 py-4"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <Party label="From" name={r.provider.name || "Your provider"} />
        <Party label="To" name={r.memberName || "You"} />
      </div>

      <table className="w-full text-[13.5px]">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th className="text-left py-2 font-mono text-[10.5px] uppercase font-medium" style={{ color: "var(--fg-3)" }}>
              Item
            </th>
            <th className="text-right py-2 font-mono text-[10.5px] uppercase font-medium" style={{ color: "var(--fg-3)" }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-3" style={{ color: "var(--ink)" }}>
              {r.description}
              <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>
                {KIND_LABEL[r.kind]}
                {r.period ? ` · ${formatDate(r.period.start)} to ${formatDate(r.period.end)}` : ""}
              </span>
            </td>
            <td
              className="py-3 text-right font-mono"
              style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
            >
              {formatMinor(r.currency, r.amountMinor)}
            </td>
          </tr>
          {r.refunds.map((x, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="py-3" style={{ color: "var(--fg-2)" }}>
                Refund · {formatDate(x.refundedAt)}
              </td>
              <td
                className="py-3 text-right font-mono"
                style={{ color: "var(--signal-ink)", fontVariantNumeric: "tabular-nums" }}
              >
                −{formatMinor(r.currency, x.amountMinor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl
        className="rounded-(--r-3) px-4 py-3.5 text-[13px] leading-relaxed"
        style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}
      >
        <div>
          <dt className="inline font-medium" style={{ color: "var(--ink)" }}>
            Payment
          </dt>
          <dd className="inline"> · {METHOD_LABEL[r.method]}</dd>
        </div>
        {r.reference && (
          <div>
            <dt className="inline font-medium" style={{ color: "var(--ink)" }}>
              Reference
            </dt>
            <dd className="inline font-mono text-[12px]"> · {r.reference}</dd>
          </div>
        )}
      </dl>

      <button type="button" className="btn-ghost-v2 self-start" onClick={() => window.print()}>
        Print or save as PDF
      </button>
    </article>
  );
}

function Party({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div className="text-[14px] font-medium mt-1.5" style={{ color: "var(--ink)" }}>
        {name}
      </div>
    </div>
  );
}
