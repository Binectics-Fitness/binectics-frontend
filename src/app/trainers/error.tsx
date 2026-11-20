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
      description="Couldn't load trainers. Try again."
      homeHref="/trainers"
      homeLabel="Browse trainers"
    />
  );
}
