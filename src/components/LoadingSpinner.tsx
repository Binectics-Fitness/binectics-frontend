/**
 * LoadingSpinner — simple, no glow, no gradient backgrounds.
 * Ink-colored spinner with subtle opacity. No celebration.
 */

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "h-5 w-5 border-[1.5px]",
  md: "h-7 w-7 border-2",
  lg: "h-9 w-9 border-2",
} as const;

export function LoadingSpinner({
  label = "Loading…",
  size = "lg",
  fullScreen = true,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="text-center">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-solid border-t-transparent mx-auto`}
        style={{ borderColor: "var(--border-2)", borderTopColor: "transparent" }}
      />
      {label && (
        <p className="mt-3 text-[13px] font-medium" style={{ color: "var(--fg-3)" }}>
          {label}
        </p>
      )}
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
      {spinner}
    </div>
  );
}

export default LoadingSpinner;
