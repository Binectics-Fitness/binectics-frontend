"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CheckoutError({
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Checkout Error
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Something went wrong during checkout. Your payment has not been
          processed. Please try again.
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
            href="/marketplace"
            className="px-5 py-2.5 border border-neutral-200 text-foreground font-semibold rounded-lg text-sm hover:bg-neutral-100 transition-colors"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
