"use client";

import { BinecticsMark } from "@/components/BinecticsLogo";
import Link from "next/link";

export default function OfflinePage() {
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
            color: "var(--fg-3)",
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
              background: "var(--fg-3)",
              borderRadius: "50%",
            }}
          />
          Offline &middot; cached
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
          You&apos;re{" "}
          <em
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            offline
          </em>
          .
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
          Your last-loaded session is cached and read-only. New bookings and
          check-ins will sync the moment you&apos;re back online.
        </p>

        {/* Actions */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary-v2"
            style={{ height: 38, padding: "0 16px" }}
          >
            Try to reconnect
          </button>
          <Link
            href="/dashboard/bookings"
            className="btn-ghost-v2"
            style={{ height: 38, padding: "0 16px" }}
          >
            View cached bookings
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
            <span>Last sync</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              2 min ago
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
            <span>Pending actions</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              0
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
            <span>Status</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              Offline
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
