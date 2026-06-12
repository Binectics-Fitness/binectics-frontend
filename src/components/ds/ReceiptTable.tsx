/**
 * ReceiptTable — mono numerals, hairline rows, total at bottom.
 *
 * From booking-confirmed.html:
 *   13px rows, flex space-between, 8px vertical padding.
 *   Keys in fg-3, values in mono tabular-nums ink.
 *   Total row: border-top, 500 weight, 16px sans value.
 */

interface ReceiptRow {
  label: string;
  value: string;
}

interface ReceiptTableProps {
  rows: ReceiptRow[];
  total: { label: string; value: string };
  meta?: string;
  className?: string;
}

export function ReceiptTable({ rows, total, meta, className = "" }: ReceiptTableProps) {
  return (
    <div className={className}>
      {rows.map((r, i) => (
        <div key={i} className="flex justify-between text-[13px]" style={{ padding: "8px 0" }}>
          <span style={{ color: "var(--fg-3)" }}>{r.label}</span>
          <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
        </div>
      ))}
      <div
        className="flex justify-between font-medium"
        style={{ paddingTop: "14px", marginTop: "6px", borderTop: "1px solid var(--border)" }}
      >
        <span className="text-[13px]" style={{ color: "var(--ink)" }}>{total.label}</span>
        <span className="text-[16px]" style={{ color: "var(--ink)", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
          {total.value}
        </span>
      </div>
      {meta && (
        <div
          className="flex justify-between font-mono text-[10.5px] uppercase tracking-[0.05em]"
          style={{ color: "var(--fg-3)", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}
        >
          {meta}
        </div>
      )}
    </div>
  );
}
