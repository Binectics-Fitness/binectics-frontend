"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      eyebrow="Onboarding error"
      title="Something went wrong."
      description="An error occurred during onboarding. Try again, or head back to your dashboard."
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
    />
  );
}
