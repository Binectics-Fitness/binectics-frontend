'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-red-100">
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-black text-foreground mb-4 sm:text-4xl">
          Something went wrong
        </h2>
        <p className="text-lg text-foreground-secondary mb-8 leading-relaxed">
          We encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>
        {error.digest && (
          <p className="text-sm text-foreground-tertiary mb-8">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-neutral-300 px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-neutral-100"
          >
            Go to Homepage
          </Link>
        </div>
        <div className="mt-12">
          <p className="text-sm text-foreground-secondary">
            Need help?{' '}
            <Link href="/contact" className="text-accent-blue-500 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
