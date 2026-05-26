"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";

export default function DashboardError({
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
      <div
        className="w-full text-center"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          maxWidth: 480,
          padding: "clamp(32px, 6vw, 48px) clamp(20px, 5vw, 40px)",
        }}
      >
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <BinecticsMark size={28} className="text-(--ink)" />
        </div>

        {/* Eyebrow */}
        <div
          className="eyebrow"
          style={{ color: "var(--danger)", marginBottom: 16 }}
        >
          Dashboard error
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 28,
            letterSpacing: "-0.025em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Something went wrong.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 28,
            maxWidth: "36ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          An error occurred while loading this page. Try again or head back to
          your dashboard.
        </p>

        {/* Actions */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => reset()}
            className="btn-primary-v2"
            style={{ height: 36, padding: "0 16px" }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="btn-ghost-v2"
            style={{ height: 36, padding: "0 16px" }}
          >
            Back to dashboard
          </Link>
        </div>

        {/* Error digest */}
        {error.digest && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-3)",
              letterSpacing: "0.02em",
            }}
          >
            {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}
