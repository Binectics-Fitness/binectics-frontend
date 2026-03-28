interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-3",
  lg: "h-12 w-12 border-4",
} as const;

export function LoadingSpinner({
  label = "Loading...",
  size = "lg",
  fullScreen = true,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="text-center animate-fade-in">
      <div className="relative inline-flex">
        <div
          className={`${sizeMap[size]} animate-spin rounded-full border-solid border-primary-500 border-r-transparent`}
        />
        {/* Subtle glow behind spinner */}
        <div
          className={`absolute inset-0 ${sizeMap[size]} rounded-full opacity-20 blur-md`}
          style={{ background: "#00d991" }}
        />
      </div>
      {label && (
        <p className="mt-4 text-sm font-medium text-foreground-secondary">
          {label}
        </p>
      )}
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="flex min-h-screen items-center justify-center gradient-section-green">
      {spinner}
    </div>
  );
}

export default LoadingSpinner;
