"use client";

import { useEffect } from "react";

import { reloadIfStaleBuildError } from "@/lib/utils/staleBuildReload";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reloadIfStaleBuildError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          background: "oklch(0.985 0.005 85)",
          color: "oklch(0.16 0.01 80)",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "32rem", width: "100%", textAlign: "center" }}>
            <div
              style={{
                margin: "0 auto 1.5rem",
                display: "flex",
                height: "4rem",
                width: "4rem",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: "oklch(0.95 0.03 25)",
              }}
            >
              <svg
                style={{ height: "2rem", width: "2rem", color: "oklch(0.58 0.18 25)" }}
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
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "oklch(0.55 0.01 80)",
                marginBottom: "1.5rem",
              }}
            >
              A critical error occurred. Please try again.
            </p>
            {error.digest && (
              <p
                style={{
                  fontFamily: "Geist Mono, ui-monospace, monospace",
                  fontSize: "0.75rem",
                  color: "oklch(0.72 0.005 80)",
                  marginBottom: "1rem",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              style={{
                padding: "0.625rem 2rem",
                backgroundColor: "oklch(0.16 0.01 80)",
                color: "oklch(0.985 0.005 85)",
                fontWeight: 500,
                fontSize: "0.875rem",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
