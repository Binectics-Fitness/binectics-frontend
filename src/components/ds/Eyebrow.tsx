/**
 * Eyebrow — mono uppercase section label
 * Font: Geist Mono, 10.5px, uppercase, tracking +5-6%
 * Color: --fg-3 (default) or --fg-4 (muted)
 */
interface EyebrowProps {
  children: React.ReactNode;
  muted?: boolean;
  className?: string;
}

export function Eyebrow({ children, muted, className = "" }: EyebrowProps) {
  return (
    <div
      className={`font-mono text-[10.5px] uppercase tracking-[0.05em] ${className}`}
      style={{ color: muted ? "var(--fg-4)" : "var(--fg-3)" }}
    >
      {children}
    </div>
  );
}
