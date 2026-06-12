/**
 * DSCard — card container following design system
 * Radius: r-3 (10px), border: 1px --border, bg: --bg (white)
 * Variant: default (white bg) or flat (bg-2)
 * No shadow by default. Overflow hidden for image headers.
 */
interface DSCardProps {
  children: React.ReactNode;
  flat?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DSCard({ children, flat, className = "", style }: DSCardProps) {
  return (
    <div
      className={`rounded-[var(--r-3)] overflow-hidden ${className}`}
      style={{
        background: flat ? "var(--bg-2)" : "var(--bg)",
        border: "1px solid var(--border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * DSCardHead — standard card header
 * Padding: 14px 18px, border-bottom, h3 at 14px font-medium
 */
interface DSCardHeadProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function DSCardHead({ title, subtitle, action }: DSCardHeadProps) {
  return (
    <div
      className="flex items-center justify-between px-4.5 py-3.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div>
        <h3
          className="text-[14px] font-medium"
          style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
        >
          {title}
        </h3>
        {subtitle && (
          <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
            {subtitle}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}
