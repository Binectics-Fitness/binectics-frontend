"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function FormsError({
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
      eyebrow="Forms error"
      title="Something went wrong."
      description="An error occurred loading this form. Try again, or head back to your dashboard."
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
    />
  );
}
