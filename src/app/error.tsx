"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BinecticsMark } from "@/components/BinecticsLogo";

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
    <div
      className="min-h-screen grid place-items-center p-8"
      style={{ background: "var(--bg)", fontFamily: "var(--font-sans)" }}
    >
      <div className="text-center" style={{ maxWidth: 480 }}>
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 28 }}>
          <BinecticsMark size={32} className="text-(--ink)" />
        </div>

        {/* Eyebrow */}
        <div
          className="eyebrow"
          style={{ color: "var(--danger)", marginBottom: 16 }}
        >
          Something went wrong
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 36,
            letterSpacing: "-0.028em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          An unexpected error occurred.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 16,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 32,
            maxWidth: "38ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          We&apos;ve been notified and are looking into it. Try refreshing the
          page, or head back to the homepage.
        </p>

        {/* Actions */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => reset()}
            className="btn-primary-v2"
            style={{ height: 38, padding: "0 20px" }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="btn-ghost-v2"
            style={{ height: 38, padding: "0 20px" }}
          >
            Back to home
          </Link>
        </div>

        {/* Error digest */}
        {error.digest && (
          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              className="flex justify-between"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                color: "var(--fg-3)",
                padding: "4px 0",
              }}
            >
              <span>Error ID</span>
              <strong
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {error.digest}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
