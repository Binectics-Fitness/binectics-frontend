"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";

export default function TwoFactorRecoveryPage() {
  const [code, setCode] = useState("");

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
              background: "oklch(0.65 0.18 75)",
              borderRadius: "50%",
            }}
          />
          2FA recovery &middot; lost device
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
          Lost your{" "}
          <em
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            phone
          </em>
          ?
        </h1>

        {/* Description */}
        <p
          className="text-center mx-auto"
          style={{
            fontSize: 15,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 28,
            maxWidth: "38ch",
          }}
        >
          Enter one of the 8 recovery codes you saved when you set up 2FA. Each
          code only works once — we&apos;ll regenerate the others.
        </p>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = "/dashboard/settings#security";
          }}
        >
          <div
            className="flex flex-col"
            style={{ gap: 6, marginBottom: 14 }}
          >
            <label
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--fg-3)",
              }}
            >
              Recovery code
            </label>
            <input
              type="text"
              maxLength={11}
              placeholder="XXXX-XXXX"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border-2)",
                borderRadius: 8,
                padding: 14,
                fontFamily: "ui-monospace, monospace",
                fontSize: 22,
                letterSpacing: "0.4em",
                textAlign: "center",
                color: "var(--ink)",
                width: "100%",
                textTransform: "uppercase",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary-v2"
            style={{
              width: "100%",
              height: 42,
              justifyContent: "center",
              marginTop: 6,
            }}
          >
            Use recovery code
          </button>
        </form>

        {/* Helper */}
        <p
          className="text-center"
          style={{
            fontSize: 13,
            color: "var(--fg-3)",
            marginTop: 16,
          }}
        >
          Lost all your codes too?{" "}
          <Link
            href="/help"
            style={{
              color: "var(--ink)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationColor: "var(--border-2)",
            }}
          >
            Contact support
          </Link>{" "}
          — we&apos;ll verify by another channel (typically 4-6 hours).
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
            <span>Account</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              t&bull;&bull;&bull;&bull;@gmail.com
            </strong>
          </div>
          <div className="flex justify-between" style={{ padding: "4px 0" }}>
            <span>Codes left</span>
            <strong
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              8 of 8 unused
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
