"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [error, setError] = useState("");

  const gymId = params.gymId as string;

  // Mock gym data - in real app, fetch from API
  const gym = {
    id: gymId,
    name: "PowerHouse Fitness Downtown",
    address: "123 Main St, New York, NY",
    image: null,
  };

  const handleCheckIn = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/check-in/${gymId}`);
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real app, call API to record check-in
      // await fetch('/api/check-ins', {
      //   method: 'POST',
      //   body: JSON.stringify({ gymId, userId: user.id }),
      // });

      setCheckInSuccess(true);

      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err) {
      setError("Failed to check in. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  if (checkInSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
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
            Check-in Successful!
          </h1>
          <p className="text-foreground/60 mb-2">You've checked in to</p>
          <p className="text-xl font-bold text-foreground mb-6">{gym.name}</p>
          <p className="text-sm text-foreground/60">Enjoy your workout! 💪</p>
          <p className="text-xs text-foreground/40 mt-4">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-black text-white mb-2">{gym.name}</h1>
          <p className="text-white/80 text-sm">{gym.address}</p>
        </div>

        {/* Check-in Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!isAuthenticated ? (
            <div className="text-center mb-6">
              <p className="text-foreground/60 mb-4">
                Please sign in to check in to this gym
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-black text-foreground">
                  {user?.first_name?.charAt(0)}
                  {user?.last_name?.charAt(0)}
                </span>
              </div>
              <p className="font-semibold text-foreground mb-1">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-foreground/60">{user?.email}</p>
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={isChecking}
            className="w-full h-14 bg-primary-500 text-foreground font-bold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isChecking ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
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
                Checking In...
              </span>
            ) : isAuthenticated ? (
              "Check In Now"
            ) : (
              "Sign In to Check In"
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-foreground mb-3">
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Your visit will be recorded
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Track your gym attendance
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Build your fitness streak
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
