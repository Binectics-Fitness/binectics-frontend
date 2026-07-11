"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

export default function TwoFactorRecoveryPage() {
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center h-14 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/"><BinecticsLockup /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="eyebrow mb-2">2FA recovery</div>
            <h1 className="text-[28px] font-medium leading-tight" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
              Enter recovery code
            </h1>
            <p className="text-[14.5px] mt-2" style={{ color: "var(--fg-3)" }}>
              Lost your authenticator device? Use one of your saved recovery codes.
            </p>
          </div>

          <div className="rounded-(--r-3) p-4 mb-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center py-1 text-[12px]">
              <span className="font-mono uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Account</span>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>t••••@gmail.com</strong>
            </div>
            <div className="flex justify-between items-center py-1 text-[12px]">
              <span className="font-mono uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Codes left</span>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>8 of 8</strong>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/dashboard/settings#security";
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                Recovery code
              </label>
              <input
                type="text"
                required
                minLength={9}
                maxLength={11}
                pattern="[A-Z0-9]{4}-[A-Z0-9]{4}"
                placeholder="XXXX-XXXX"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-11.5 w-full rounded-(--r-2) px-3 text-center text-[20px]"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-2)",
                  color: "var(--ink)",
                  fontFamily: "ui-monospace, monospace",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                }}
              />
            </div>

            <button type="submit" className="btn-primary-v2 lg w-full justify-center">
              Use recovery code
            </button>

            <Link href="/login" prefetch={false} className="btn-ghost-v2 w-full justify-center">
              Back to sign in
            </Link>
          </form>

          <p className="text-center text-[13px] mt-4" style={{ color: "var(--fg-3)" }}>
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
            and we&apos;ll verify by another channel.
          </p>
        </div>
      </main>
    </div>
  );
}
