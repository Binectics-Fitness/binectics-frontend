/**
 * ListRow — a card row: title, mono meta line, optional leading/trailing
 * slots, and a chevron when the row goes somewhere.
 *
 * Semantics follow the behaviour:
 *   href     → a Next.js <Link> (chevron shown)
 *   onClick  → a <button> (chevron shown)
 *   neither  → a plain <div> (no chevron: nothing to open)
 * Card: --bg, 1px --border, --r-3, padding 12px 14px.
 * Don't put another link or button in `trailing` of an interactive row —
 * nested controls are invalid; use a non-interactive row instead.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface ListRowProps {
  title: ReactNode;
  /** Mono uppercase line, e.g. "Wed 21 May · Strength · 45 min". */
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Override the chevron (default: shown when the row is interactive). */
  chevron?: boolean;
  className?: string;
}

const ROW_CLASS =
  "flex w-full items-center gap-3 rounded-[var(--r-3)] px-3.5 py-3 text-left transition-colors duration-[var(--motion-fast)]";

export function ListRow({ title, meta, leading, trailing, href, onClick, chevron, className = "" }: ListRowProps) {
  const interactive = Boolean(href || onClick);
  const showChevron = chevron ?? interactive;
  const style = { background: "var(--bg)", border: "1px solid var(--border)" };
  const hover = interactive ? "hover:bg-[var(--bg-2)] focus-visible:outline-2 focus-visible:outline-offset-2" : "";

  const content = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
          {title}
        </span>
        {meta && (
          <span
            className="mt-0.5 block truncate font-mono text-[11px] uppercase tracking-[0.04em]"
            style={{ color: "var(--fg-3)" }}
          >
            {meta}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
      {showChevron && (
        <ChevronRight aria-hidden="true" data-chevron size={14} className="shrink-0" style={{ color: "var(--fg-4)" }} />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${ROW_CLASS} ${hover} ${className}`} style={style}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${ROW_CLASS} ${hover} ${className}`} style={style}>
        {content}
      </button>
    );
  }
  return (
    <div className={`${ROW_CLASS} ${className}`} style={style}>
      {content}
    </div>
  );
}
