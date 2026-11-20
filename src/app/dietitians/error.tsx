"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function DietitiansError({
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
      eyebrow="Dietitians error"
      title="Something went wrong."
      description="Couldn't load dietitians. Try again."
      homeHref="/dietitians"
      homeLabel="Browse dietitians"
    />
  );
}
