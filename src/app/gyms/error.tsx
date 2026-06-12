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
      description="We were unable to load gyms. Try again, or head back to browse gyms."
      homeHref="/gyms"
      homeLabel="Back to gyms"
    />
  );
}
