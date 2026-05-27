"use client";

import Link from "next/link";

export interface PlanCardPlan {
  name: string;
  meta: string;
  price: string;
  priceSub: string;
  tagline: string;
  cta: string;
  divider: string;
  features: string[];
  text?: boolean;
  ghost?: boolean;
  featured?: boolean;
  ink?: boolean;
  badge?: string;
}

interface PlanCardProps {
  plan: PlanCardPlan;
}

export function PlanCard({ plan: p }: PlanCardProps) {
  return (
    <div
      className={`rounded-(--r-3) flex flex-col relative ${p.featured ? "bg-bg-2" : p.ink ? "" : "bg-bg"}`}
      style={{
        padding: "28px 28px 24px",
        gap: "16px",
        border: `1px solid ${p.featured || p.ink ? "var(--ink)" : "var(--border)"}`,
        background: p.ink ? "var(--ink)" : undefined,
        color: p.ink ? "var(--bg)" : undefined,
      }}
    >
      {(p.featured || p.badge) && (
        <span
          className="absolute font-mono text-[10.5px] uppercase tracking-[0.05em] inline-flex items-center gap-1.25 rounded-full"
          style={{
            top: "-10px",
            left: "24px",
            padding: "4px 10px",
            background: p.ink ? "var(--signal)" : "var(--ink)",
            color: p.ink ? "oklch(0.18 0.05 148)" : "var(--bg)",
          }}
        >
          <span
            className="w-1.25 h-1.25 rounded-full"
            style={{ background: p.ink ? "oklch(0.18 0.05 148)" : "var(--signal)" }}
          />
          {p.badge || "Most picked"}
        </span>
      )}
      <div className="flex justify-between items-baseline">
        <div
          className="text-[16px] font-medium"
          style={{ letterSpacing: "-0.005em", color: p.ink ? "var(--bg)" : "var(--ink)" }}
        >
          {p.name}
        </div>
        <div
          className="font-mono text-[11px] uppercase tracking-[0.04em]"
          style={{ color: p.ink ? "oklch(0.65 0.005 85)" : "var(--fg-3)" }}
        >
          {p.meta}
        </div>
      </div>
      <div
        className={`font-medium flex items-baseline gap-2 flex-wrap ${p.text ? "text-[36px]" : "text-[32px] sm:text-[56px]"}`}
        style={{
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: p.ink ? "var(--bg)" : "var(--ink)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {p.price}
        <small
          className="font-mono text-[12px] sm:text-[14px] font-normal"
          style={{ color: p.ink ? "oklch(0.7 0.005 85)" : "var(--fg-3)" }}
        >
          {p.priceSub}
        </small>
      </div>
      <p
        className="text-[13.5px] leading-[1.5] max-w-[32ch]"
        style={{ color: p.ink ? "oklch(0.82 0.005 85)" : "var(--fg-2)" }}
      >
        {p.tagline}
      </p>
      <Link
        href={p.ink ? "#" : "/login?mode=signup"}
        className={`${p.featured ? "btn-primary-v2" : p.ink ? "btn-signal-v2" : "btn-ghost-v2"} w-full justify-center min-h-11`}
        style={p.ink ? { color: "oklch(0.18 0.05 148)" } : undefined}
      >
        {p.cta}
      </Link>
      <div
        className="font-mono text-[10.5px] uppercase tracking-[0.05em]"
        style={{
          borderTop: `1px solid ${p.ink ? "oklch(0.3 0.008 80)" : "var(--border)"}`,
          marginTop: "4px",
          paddingTop: "16px",
          color: p.ink ? "oklch(0.7 0.005 85)" : "var(--fg-3)",
        }}
      >
        {p.divider}
      </div>
      <ul className="flex flex-col gap-2.25 list-none p-0 m-0">
        {p.features.map((f) => (
          <li
            key={f}
            className="flex gap-2.5 items-start text-[13.5px] leading-[1.5]"
            style={{ color: p.ink ? "oklch(0.85 0.005 85)" : "var(--fg-2)" }}
          >
            <span
              className="w-2.5 h-1.5 border-l-[1.5px] border-b-[1.5px] -rotate-45 shrink-0 mt-[5px]"
              style={{ borderColor: p.ink ? "var(--signal)" : "var(--ink)" }}
            />
            <span
              dangerouslySetInnerHTML={{
                __html: f.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong style="color:var(--ink);font-weight:500">$1</strong>'
                ),
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
