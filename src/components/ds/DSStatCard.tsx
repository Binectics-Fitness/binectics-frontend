/**
 * DSStatCard — KPI stat card
 * Mono uppercase label (11px), large value (28px tabular-nums), optional delta
 * Delta: signal-ink for positive, danger for negative
 */
import { StatusDot } from "./StatusDot";

interface DSStatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  dot?: "signal" | "warn" | "danger" | "muted";
  className?: string;
}

export function DSStatCard({ label, value, delta, deltaPositive = true, dot, className = "" }: DSStatCardProps) {
  return (
    <div
      className={`rounded-[var(--r-3)] px-4.5 py-4 ${className}`}
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        {dot && <StatusDot variant={dot} size={6} />}
        <span
          className="font-mono text-[11px] uppercase tracking-[0.04em]"
          style={{ color: "var(--fg-3)" }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-[28px] font-medium"
          style={{
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            className="font-mono text-[12px]"
            style={{ color: deltaPositive ? "var(--signal-ink)" : "var(--danger)" }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
