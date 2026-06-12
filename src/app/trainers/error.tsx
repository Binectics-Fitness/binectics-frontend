"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function TrainersError({
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
      eyebrow="Trainers error"
      title="Something went wrong."
      description="We were unable to load trainers. Try again, or head back to browse trainers."
      homeHref="/trainers"
      homeLabel="Back to trainers"
    />
  );
}
