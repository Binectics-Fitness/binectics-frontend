/**
 * Binectics brand mark — two concentric arcs (open C-curves).
 * The opening on the right reads as a connection point.
 * Built on a 48-unit grid, 5-6px stroke, round caps.
 *
 * Usage:
 *   <BinecticsMark size={24} />
 *   <BinecticsLockup />
 */

interface MarkProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function BinecticsMark({
  size = 24,
  className = "",
  strokeWidth = 6,
}: MarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d="M 32 6 A 18 18 0 1 0 32 42" />
      <path d="M 28 16 A 8 8 0 1 0 28 32" />
    </svg>
  );
}

interface LockupProps {
  markSize?: number;
  className?: string;
}

export function BinecticsLockup({
  markSize = 24,
  className = "",
}: LockupProps) {
  return (
    <span
      className={`inline-flex items-center gap-[10px] ${className}`}
    >
      <BinecticsMark size={markSize} />
      <span
        className="font-semibold text-ink"
        style={{
          letterSpacing: "-0.02em",
          fontSize: "17px",
        }}
      >
        Binectics
      </span>
    </span>
  );
}

export default BinecticsLockup;
