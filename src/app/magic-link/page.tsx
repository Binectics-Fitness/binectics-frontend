"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";

export default function MagicLinkPage() {
  const [remaining, setRemaining] = useState(9 * 60 + 42);

  useEffect(() => {
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
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div
      className="min-h-screen grid place-items-center p-8"
      style={{ background: "var(--bg-2)", fontFamily: "var(--font-sans)" }}
    >
      <div
        className="w-full"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          maxWidth: 480,
          padding: "48px 40px",
        }}
      >
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <BinecticsMark size={28} className="text-(--ink)" />
        </div>

        {/* Eyebrow */}
        <div
          className="flex items-center justify-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 16,
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: "var(--signal)",
              borderRadius: "50%",
              animation: "pulse 1.6s ease-in-out infinite",
            }}
          />
          Magic link &middot; verifying
        </div>

        {/* Heading */}
        <h1
          className="text-center"
          style={{
            fontSize: 30,
            letterSpacing: "-0.024em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.15,
            marginBottom: 14,
          }}
        >
          Signing you{" "}
          <em
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            in
          </em>
          .
        </h1>

        {/* Description */}
        <p
          className="text-center mx-auto"
          style={{
            fontSize: 15,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 0,
            maxWidth: "38ch",
          }}
        >
          Hang on — checking your link with our auth service. This usually takes
          under 2 seconds.
        </p>

        {/* Spinner */}
        <div
          className="flex justify-center"
          style={{ padding: "18px 0 28px" }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid var(--bg-3)",
              borderTopColor: "var(--ink)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>

        {/* Helper link */}
        <p
          className="text-center"
          style={{ fontSize: 13, color: "var(--fg-3)" }}
        >
          <Link
            href="/login" prefetch={false}
            style={{
              color: "var(--ink)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationColor: "var(--border-2)",
            }}
          >
            Sign in with password instead
          </Link>
        </p>

        {/* Footer detail */}
        <div
          className="flex flex-col"
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
            gap: 4,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-3)",
          }}
        >
          <div className="flex justify-between" style={{ padding: "4px 0" }}>
            <span>Link expires in</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              {minutes}:{seconds}
            </strong>
          </div>
          <div className="flex justify-between" style={{ padding: "4px 0" }}>
            <span>Device</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              Safari &middot; macOS &middot; Cape Town
            </strong>
          </div>
        </div>
      </div>

    </div>
  );
}
