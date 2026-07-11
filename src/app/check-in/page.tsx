"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";

const CODE_LENGTH = 6;
// Mirrors the api's confusion-free alphabet (no 0/O, 1/I/L).
const CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

/** Uppercase and strip the spacing/hyphens people type between groups. */
function normalize(input: string): string {
  return input.toUpperCase().replace(/[\s-]+/g, "");
}

/**
 * Manual check-in entry — the typed alternative to scanning the gym's QR
 * (camera issues, borrowed phone, QR screen down). The code is printed
 * under the kiosk QR. Submitting routes to /check-in/<CODE>, which shows
 * the gym's name for confirmation before anything is logged.
 */
export default function ManualCheckInPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const code = normalize(value);
  const valid = CODE_PATTERN.test(code);

  const submit = () => {
    if (!valid) {
      setError(
        code.length === CODE_LENGTH
          ? "That doesn't look like a valid code — codes never contain 0, O, 1, I or L."
          : `Codes are ${CODE_LENGTH} characters, e.g. AB23CD.`,
      );
      return;
    }
    router.push(`/check-in/${code}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-10 flex justify-center">
          <BinecticsLockup />
        </div>

        <h1
          className="text-[26px] font-medium"
          style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}
        >
          Enter your gym&rsquo;s check-in code
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--fg-2)" }}>
          It&rsquo;s the {CODE_LENGTH}-character code shown under the QR at
          the front desk.
        </p>

        <form
          className="mt-8 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="AB23CD"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={CODE_LENGTH + 3}
            aria-label="Check-in code"
            className="h-14 rounded-(--r-2) px-4 text-center font-mono text-[22px] uppercase tracking-[0.35em]"
            style={{
              border: error
                ? "1px solid var(--danger)"
                : "1px solid var(--border-2)",
              color: "var(--ink)",
              background: "var(--bg)",
            }}
          />
          {error && (
            <p className="text-[13px]" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary-v2"
            disabled={code.length < CODE_LENGTH}
          >
            Continue
          </button>
          <Link
            href="/dashboard/member"
            className="btn-ghost-v2"
            style={{ textDecoration: "none" }}
          >
            Cancel
          </Link>
        </form>

        <p className="mt-6 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          Scanning works too — point your camera at the QR.{" "}
          <Link
            href="/qr-help"
            className="underline underline-offset-2"
            style={{ color: "var(--fg-2)" }}
          >
            Trouble scanning?
          </Link>
        </p>
      </div>
    </div>
  );
}
