"use client";

import { useState, useEffect } from "react";
import { BinecticsMark } from "@/components/BinecticsLogo";

export default function RateLimitPage() {
  const [remaining, setRemaining] = useState(14);
  const canRetry = remaining <= 0;

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

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
            color: "oklch(0.42 0.13 75)",
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
              background: "oklch(0.65 0.18 75)",
              borderRadius: "50%",
            }}
          />
          429 &middot; too fast
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
            Slow
          </em>{" "}
          down a moment.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 16,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 0,
            maxWidth: "38ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          You&apos;ve hit our request limit. We do this to keep the platform
          fast for everyone. Wait a few seconds and try again.
        </p>

        {/* Countdown */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 32,
            color: "var(--ink)",
            margin: "18px 0 28px",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.04em",
          }}
        >
          00:{String(remaining).padStart(2, "0")}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => {
              if (canRetry) window.location.reload();
            }}
            disabled={!canRetry}
            className="btn-primary-v2"
            style={{
              height: 38,
              padding: "0 16px",
              opacity: canRetry ? 1 : 0.5,
              cursor: canRetry ? "pointer" : "not-allowed",
            }}
          >
            {canRetry ? "Try again" : `Try again in ${remaining}s`}
          </button>
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
            <span>Rate</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              60 req / min
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
            <span>Window</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              {canRetry ? "Ready" : `Resets in ${remaining}s`}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
