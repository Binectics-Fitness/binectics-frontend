"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceListing } from "@/lib/types";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const hasAutoCheckedIn = useRef(false);

  const gymId = params.gymId as string;

  const loadListing = useCallback(async () => {
    try {
      const res = await marketplaceService.getListingById(gymId);
      if (res.success && res.data) setListing(res.data);
    } catch {
      // Non-fatal: gym name simply won't show
    }
  }, [gymId]);

  useEffect(() => {
    window.setTimeout(() => void loadListing(), 0);
  }, [loadListing]);

  const doCheckIn = useCallback(async () => {
    setIsChecking(true);
    setError("");
    try {
      const res = await checkinsService.scan({ listing_id: gymId });
      if (res.success) {
        setCheckedInAt(new Date().toLocaleTimeString());
        setCheckInSuccess(true);
        window.setTimeout(() => router.push("/dashboard"), 3000);
      } else {
        setError("Failed to check in. Please try again.");
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        setError("You've already checked in today. Come back tomorrow! 🏋️");
      } else if (status === 404) {
        setError(
          "No active subscription found for this gym. Please subscribe first.",
        );
      } else {
        setError("Failed to check in. Please try again.");
      }
    } finally {
      setIsChecking(false);
    }
  }, [gymId, router]);

  // Auto check-in as soon as auth is resolved and user is signed in
  // This means: scan QR → (step 1) land here → auto check-in → (step 2) success
  // No button tap needed for authenticated users
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      // Not signed in → redirect to login, return here after
      router.push(`/login?redirect=/check-in/${gymId}`);
      return;
    }
    if (hasAutoCheckedIn.current) return;
    hasAutoCheckedIn.current = true;
    window.setTimeout(() => void doCheckIn(), 0);
  }, [isAuthLoading, isAuthenticated, gymId, router, doCheckIn]);

  const gymName = listing?.headline ?? "this gym";
  const gymAddress = listing
    ? [listing.city, listing.country_code].filter(Boolean).join(", ")
    : "";

  // ── Success screen ──────────────────────────────────────────────
  if (checkInSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-4 sm:p-8 text-center">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-3">
            Checked In!
          </h1>
          <p className="text-foreground/60 mb-2">Welcome to</p>
          <p className="text-xl font-bold text-foreground mb-2">{gymName}</p>
          {checkedInAt && (
            <p className="text-sm text-foreground/50 mb-4">at {checkedInAt}</p>
          )}
          <p className="text-sm text-foreground/60">Enjoy your workout! 💪</p>
          <p className="text-xs text-foreground/40 mt-4">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ── Checking in / auth loading ──────────────────────────────────
  const isProcessing = isAuthLoading || isChecking;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Gym Header */}
        <div className="bg-accent-blue-500 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-accent-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10"
              />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-2">{gymName}</h1>
          {gymAddress && <p className="text-white/80 text-sm">{gymAddress}</p>}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-8 text-center">
          {/* Member info */}
          {user && (
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-black text-foreground">
                  {user.first_name?.charAt(0)}
                  {user.last_name?.charAt(0)}
                </span>
              </div>
              <p className="font-semibold text-foreground">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-foreground/60">{user.email}</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-left">
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <button
                onClick={() => {
                  hasAutoCheckedIn.current = false;
                  void doCheckIn();
                }}
                className="mt-3 text-sm text-accent-blue-500 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Processing spinner */}
          {isProcessing && !error && (
            <div className="flex flex-col items-center gap-3 py-4">
              <svg
                className="animate-spin h-10 w-10 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-foreground/60 font-medium">
                {isAuthLoading ? "Verifying identity…" : "Checking in…"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
