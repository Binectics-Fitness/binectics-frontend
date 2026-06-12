"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function AdminError({
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
      eyebrow="Admin error"
      title="Something went wrong."
      description="An error occurred in the admin area. Try again, or return to the admin dashboard."
      homeHref="/admin/dashboard"
      homeLabel="Back to admin"
    />
  );
}
