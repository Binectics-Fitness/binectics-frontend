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
      description="We were unable to load dietitians. Try again, or head back to browse dietitians."
      homeHref="/dietitians"
      homeLabel="Back to dietitians"
    />
  );
}
