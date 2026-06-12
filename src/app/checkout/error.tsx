"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function CheckoutError({
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
      eyebrow="Checkout error"
      title="Something went wrong."
      description="We hit a problem completing your checkout. Try again, or head back to the marketplace."
      homeHref="/marketplace"
      homeLabel="Back to marketplace"
    />
  );
}
