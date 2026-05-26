"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BinecticsMark } from "@/components/BinecticsLogo";

export default function Error({
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
      style={{ background: "var(--bg-2)", fontFamily: "var(--font-sans)" }}
    >
      <div
        className="w-full text-center"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          maxWidth: 540,
          padding: "clamp(32px, 6vw, 56px) clamp(20px, 5vw, 48px)",
        }}
      >
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 28 }}>
          <BinecticsMark size={32} className="text-(--ink)" />
        </div>

        {/* Eyebrow */}
        <div
          className="inline-flex items-center justify-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--danger)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14,
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: "var(--danger)",
              borderRadius: "50%",
            }}
          />
          Error &middot; 500
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
          <em
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Sorry
          </em>{" "}
          — that one&apos;s on us.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 16,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 28,
            maxWidth: "38ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Something broke on our end. We&apos;ve already been paged and will
          sort it. Try the page again in a minute, or check our status feed.
        </p>

        {/* Actions */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => reset()}
            className="btn-primary-v2"
            style={{ height: 38, padding: "0 16px" }}
          >
            Retry
          </button>
          <Link
            href="#"
            className="btn-ghost-v2"
            style={{ height: 38, padding: "0 16px" }}
          >
            View status
          </Link>
          <Link
            href="/"
            className="btn-ghost-v2"
            style={{ height: 38, padding: "0 16px" }}
          >
            Back to landing
          </Link>
        </div>

        {/* Detail rows */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
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
            <span>Incident</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              {error.digest ?? "INC-2026-7712"}
            </strong>
          </div>
          <div
            className="flex justify-between"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              color: "var(--fg-3)",
              padding: "4px 0",
            }}
          >
            <span>Reported</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              just now
            </strong>
          </div>
          <div
            className="flex justify-between"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              color: "var(--fg-3)",
              padding: "4px 0",
            }}
          >
            <span>Affected</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              This page only
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
