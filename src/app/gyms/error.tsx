"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function GymsError({
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
      eyebrow="Gyms error"
      title="Something went wrong."
      description="We couldn't load gyms. Try again."
      homeHref="/gyms"
      homeLabel="Back to gyms"
    />
  );
}
