"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function MarketplaceError({
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
      eyebrow="Marketplace error"
      title="Something went wrong."
      description="We were unable to load the marketplace. Try again, or head back to browse listings."
      homeHref="/marketplace"
      homeLabel="Back to marketplace"
    />
  );
}
