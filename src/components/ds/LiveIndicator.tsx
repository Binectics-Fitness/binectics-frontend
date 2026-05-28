interface LiveIndicatorProps {
  label?: string;
  variant?: "signal" | "warn" | "danger" | "idle";
}

export function LiveIndicator({ label, variant = "signal" }: LiveIndicatorProps) {
  const variantClass = variant === "idle" ? "idle" : variant === "warn" ? "warn" : variant === "danger" ? "danger" : "";
  return <span className={`live-dot ${variantClass}`}>{label}</span>;
}
