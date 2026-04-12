"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'CeraPro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: "#f7f4ef",
          color: "#03314b",
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
                borderRadius: "1rem",
                backgroundColor: "#fee2e2",
              }}
            >
              <svg
                style={{ height: "2rem", width: "2rem", color: "#ef4444" }}
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
                fontWeight: 900,
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "1.5rem",
              }}
            >
              A critical error occurred. Please try again.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
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
                backgroundColor: "#00d991",
                color: "#03314b",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
