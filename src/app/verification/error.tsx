"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function VerificationError({
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
      eyebrow="Verification error"
      title="Something went wrong."
      description="An error occurred during verification. Try again, or head back to the sign-in page."
      homeHref="/login"
      homeLabel="Back to sign in"
    />
  );
}
