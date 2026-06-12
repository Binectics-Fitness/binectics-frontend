"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function ReviewError({
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
      eyebrow="Review error"
      title="Something went wrong."
      description="We were unable to load this review. Try again, or head back to the marketplace."
      homeHref="/marketplace"
      homeLabel="Back to marketplace"
    />
  );
}
