"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function CheckoutCancelledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-6 sm:p-10 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-foreground-secondary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground mb-3">
          Payment Cancelled
        </h1>
        <p className="text-foreground-secondary mb-8">
          Your payment was cancelled. No charges were made. You can try again
          whenever you&apos;re ready.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => router.back()} className="flex-1">
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/marketplace")}
            variant="secondary"
            className="flex-1"
          >
            Browse Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}
