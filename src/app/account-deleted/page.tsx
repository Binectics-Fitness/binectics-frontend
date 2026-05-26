import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Deleted",
  description: "Your Binectics account has been deleted.",
};

export default function AccountDeletedPage() {
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

        {/* Warn icon */}
        <div
          className="flex items-center justify-center mx-auto"
          style={{
            width: 56,
            height: 56,
            marginBottom: 18,
            borderRadius: "50%",
            background: "oklch(0.96 0.06 75)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(0.45 0.16 75)"
            strokeWidth={1.8}
            style={{ width: 22, height: 22 }}
          >
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
          </svg>
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
          Account deleted &middot; just now
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
          Your account is{" "}
          <em
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            gone
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
          We removed your personal data within 24 hours. Past bookings stay on
          your providers&apos; records for 7 years — South African tax law, not
          us.
        </p>

        {/* Detail rows */}
        <div
          className="flex flex-col"
          style={{
            marginTop: 0,
            paddingTop: 20,
            borderTop: "none",
            gap: 4,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-3)",
          }}
        >
          <div className="flex justify-between" style={{ padding: "4px 0" }}>
            <span>Removed</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              Profile &middot; activity &middot; health logs &middot; saved
              providers
            </strong>
          </div>
          <div className="flex justify-between" style={{ padding: "4px 0" }}>
            <span>Kept (legal)</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              Receipts &middot; payouts &middot; tax records
            </strong>
          </div>
          <div className="flex justify-between" style={{ padding: "4px 0" }}>
            <span>Audit ID</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              DEL-2026-8079
            </strong>
          </div>
        </div>

        {/* Helper */}
        <p
          className="text-center"
          style={{
            fontSize: 13,
            color: "var(--fg-3)",
            marginTop: 24,
          }}
        >
          Want to{" "}
          <Link
            href="/register"
            style={{
              color: "var(--ink)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationColor: "var(--border-2)",
            }}
          >
            create a new account
          </Link>
          ? You can — we don&apos;t keep blocklists.
        </p>
      </div>
    </div>
  );
}
