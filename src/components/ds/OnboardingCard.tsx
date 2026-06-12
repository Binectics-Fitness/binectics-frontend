interface OnboardingCardProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
}

export function OnboardingCard({
  currentStep,
  totalSteps,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled,
}: OnboardingCardProps) {
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="mb-6 flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-(--r-full) transition-colors ${
              i < currentStep ? "bg-ink" : i === currentStep ? "bg-ink" : "bg-bg-3"
            }`}
            style={{ transitionDuration: "var(--motion-base)" }}
          />
        ))}
      </div>
      <div
        className="rounded-(--r-3) border border-border bg-bg p-8"
        style={{ boxShadow: "var(--shadow-2)" }}
      >
        {children}
      </div>
      <div className="mt-6 flex items-center justify-between">
        {onBack ? (
          <button type="button" onClick={onBack} className="btn-ghost-v2">
            {backLabel}
          </button>
        ) : (
          <div />
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="btn-signal-v2 disabled:opacity-40"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}
