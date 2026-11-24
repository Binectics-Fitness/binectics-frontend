import styles from "./BrandLoader.module.css";

export interface BrandLoaderProps {
  /** Mark size in px. 48 is the design grid. */
  size?: number;
  className?: string;
}

/**
 * The Binectics mark as an indeterminate loader, the web side of mobile
 * BrandLoader (#243). Same geometry as BinecticsMark: two open arcs on a
 * 48-unit grid, stroke 6, round caps. The outer arc stays whole; the inner
 * arc traces on a loop. It is never rotated or recoloured, and it promises
 * nothing about how long. Drawn in currentColor; it is decorative, so the
 * caller carries the role="status" and the label.
 */
export function BrandLoader({ size = 40, className }: BrandLoaderProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      data-testid="brand-loader"
    >
      <path d="M 32 6 A 18 18 0 1 0 32 42" />
      <path d="M 28 16 A 8 8 0 1 0 28 32" pathLength={1} className={styles.inner} />
    </svg>
  );
}
