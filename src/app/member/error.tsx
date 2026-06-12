"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function MemberError({
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
      eyebrow="Member area error"
      title="Something went wrong."
      description="An error occurred loading your member area. Try again, or head back to your dashboard."
      homeHref="/dashboard/member"
      homeLabel="Back to dashboard"
    />
  );
}
