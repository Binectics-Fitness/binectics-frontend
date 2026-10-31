import type { AttributedMoney } from "@/lib/api/attributedRevenue";
import { formatMinor } from "@/lib/currencies/helpers";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <dt style={{ color: "var(--fg-2)", fontWeight: strong ? 500 : 400 }}>{label}</dt>
      <dd className="font-mono" style={{ color: "var(--ink)", fontWeight: strong ? 500 : 400, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </dd>
    </div>
  );
}

/**
 * One currency's figures: settled payments, refunds, net and where the
 * payments came from. One block per currency and never a total across them.
 */
export function MoneyBreakdown({
  money,
  title,
  grossLabel = "Settled payments",
}: {
  money: AttributedMoney;
  title?: string;
  grossLabel?: string;
}) {
  const c = money.currency;
  return (
    <div className="rounded-(--r-2) p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
        {title ?? c}
      </div>
      <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
        {formatMinor(c, money.netMinor)}
      </div>
      <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>Net · {c}</div>
      <dl className="mt-3 flex flex-col gap-1.5">
        <Line label={grossLabel} value={formatMinor(c, money.grossMinor)} />
        <Line label="Refunds" value={money.refundsMinor ? `-${formatMinor(c, money.refundsMinor)}` : formatMinor(c, 0)} />
        <Line label="Net" value={formatMinor(c, money.netMinor)} strong />
        <Line label="From sessions" value={formatMinor(c, money.consultationsMinor)} />
        <Line label="From memberships" value={formatMinor(c, money.subscriptionsMinor)} />
        <Line label="From programs and meal plans" value={formatMinor(c, money.contentMinor)} />
        <Line label="Payments" value={money.payments.toLocaleString("en-GB")} />
      </dl>
    </div>
  );
}
