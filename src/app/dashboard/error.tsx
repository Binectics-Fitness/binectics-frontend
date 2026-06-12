"use client";

import { RouteError } from "@/components/ds/RouteError";

export default function DashboardError({
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
      eyebrow="Dashboard error"
      title="Something went wrong."
      description="An error occurred while loading this page. Try again, or head back to your dashboard."
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
    />
  );
}
