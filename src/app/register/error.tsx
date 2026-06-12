"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function RegisterError({
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
      eyebrow="Sign-up error"
      title="Something went wrong."
      description="We were unable to complete sign-up. Try again, or head back to the sign-in page."
      homeHref="/login"
      homeLabel="Back to sign in"
    />
  );
}
