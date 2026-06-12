"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function SearchError({
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
      eyebrow="Search error"
      title="Something went wrong."
      description="We were unable to complete your search. Try again, or head back to the marketplace."
      homeHref="/marketplace"
      homeLabel="Back to marketplace"
    />
  );
}
