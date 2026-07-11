"use client";

/**
 * RouteError — the shared design-system error boundary UI.
 *
 * Next.js App Router renders the nearest `error.tsx` when a route segment
 * throws. Every segment's error.tsx should be a thin wrapper around this
 * component so the error experience stays consistent (brand mark, eyebrow,
 * "Try again" reset + a contextual "back" link, and the error digest).
 *
 * Note: src/app/global-error.tsx deliberately does NOT use this — it renders
 * when the root layout itself fails, so it must be fully self-contained
 * (its own <html>/<body>, no dependency on app CSS or providers).
 */

import Link from "next/link";
import { useEffect } from "react";
import { BinecticsMark } from "@/components/BinecticsLogo";
import { reloadIfStaleBuildError } from "@/lib/utils/staleBuildReload";

export interface RouteErrorProps {
  /** The error thrown by the segment (Next.js passes this to error.tsx). */
  error: Error & { digest?: string };
  /** Re-render the segment to attempt recovery (passed by Next.js). */
  reset: () => void;
  /** Small uppercase label above the heading. Defaults to "Something went wrong". */
  eyebrow?: string;
  /** Main heading. */
  title?: string;
  /** Supporting copy under the heading. */
  description?: string;
  /** Where the secondary "back" link points. Defaults to home. */
  homeHref?: string;
  /** Label for the secondary "back" link. */
  homeLabel?: string;
  /** Use full viewport height (for the root boundary). Segments use ~70vh. */
  fullScreen?: boolean;
}

export function RouteError({
  error,
  reset,
  eyebrow = "Something went wrong",
  title = "An unexpected error occurred.",
  description = "We've been notified and are looking into it. Try refreshing the page, or head back to safety.",
  homeHref = "/",
  homeLabel = "Back to home",
  fullScreen = false,
}: RouteErrorProps) {
  useEffect(() => {
    // Surface to the console (and any attached error reporter) for diagnostics.
    console.error(error);
    // A long-lived tab navigating after a redeploy fetches chunks that no
    // longer exist — one hard reload picks up the current build instead
    // of stranding the user on this screen.
    reloadIfStaleBuildError(error);
  }, [error]);

  return (
    <div
      className={`${fullScreen ? "min-h-screen" : "min-h-[70vh]"} grid place-items-center p-8`}
      style={{ background: "var(--bg)", fontFamily: "var(--font-sans)" }}
    >
      <div className="text-center" style={{ maxWidth: 480 }}>
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 28 }}>
          <BinecticsMark size={32} className="text-(--ink)" />
        </div>

        {/* Eyebrow */}
        <div className="eyebrow" style={{ color: "var(--danger)", marginBottom: 16 }}>
          {eyebrow}
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 32,
            letterSpacing: "-0.028em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.12,
            marginBottom: 14,
          }}
        >
          {title}
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
          {description}
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
            href={homeHref}
            className="btn-ghost-v2"
            style={{ height: 38, padding: "0 20px" }}
          >
            {homeLabel}
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
