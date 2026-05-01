"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function TeamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Couldn&apos;t load this page
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Something went wrong loading your team data. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-primary-500 text-foreground font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-neutral-200 text-foreground font-semibold rounded-lg text-sm hover:bg-neutral-100 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
