"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function CheckInError({
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
      eyebrow="Check-in error"
      title="Something went wrong."
      description="We hit a problem with check-in. Try again, or head back to your dashboard."
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
    />
  );
}
