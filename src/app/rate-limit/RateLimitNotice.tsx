"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AccountStatePanel, { Accent, Countdown } from "@/components/AccountStatePanel";
import {
  formatCountdown,
  parseDeadline,
  safeRedirectPath,
} from "@/lib/routing/accountState";
import { useSecondsLeft } from "@/lib/routing/useSecondsLeft";

/**
 * A 429 lands here. `until` comes from the API's Retry-After when it sent
 * one; `next` is where "Try again" goes (the login page, for a throttled
 * sign-in). With neither, the page says to wait without inventing a timer.
 */
export default function RateLimitNotice() {
  const params = useSearchParams();
  const until = parseDeadline(params.get("until"));
  const next = safeRedirectPath(params.get("next")) ?? "/";
  const left = useSecondsLeft(until);
  const waiting = until !== null && left > 0;

  return (
    <AccountStatePanel
      tone="warn"
      eyebrow="Too many requests"
      title={
        <>
          <Accent>Slow</Accent> down a moment.
        </>
      }
      description={
        waiting
          ? "We received too many requests from you in a short time. You can try again when the timer ends."
          : "We received too many requests from you in a short time. Wait a moment, then try again."
      }
      actions={
        waiting ? (
          <span
            className="btn-primary-v2"
            aria-disabled="true"
            style={{ height: 38, padding: "0 16px", opacity: 0.5, cursor: "not-allowed" }}
          >
            Try again in {left}s
          </span>
        ) : (
          <Link
            href={next}
            prefetch={false}
            className="btn-primary-v2"
            style={{ height: 38, padding: "0 16px" }}
          >
            Try again
          </Link>
        )
      }
    >
      {waiting && <Countdown label="Time until you can try again" value={formatCountdown(left)} />}
    </AccountStatePanel>
  );
}
