"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AccountStatePanel, { Accent, Countdown } from "@/components/AccountStatePanel";
import { formatCountdown, parseDeadline } from "@/lib/routing/accountState";
import { useSecondsLeft } from "@/lib/routing/useSecondsLeft";

/**
 * The login page sends a locked-out sign-in here with `until`, the moment
 * the API said sign-in reopens. Without it (opened directly) there is no
 * timer to show, so none is invented.
 */
export default function LockedNotice() {
  const params = useSearchParams();
  const until = parseDeadline(params.get("until"));
  const left = useSecondsLeft(until);
  const open = until !== null && left <= 0;

  let description: string;
  if (until === null) {
    description =
      "There were too many failed sign-in attempts for this account, so we've paused sign-in for a while. Try again later.";
  } else if (open) {
    description = "The pause is over. You can try signing in again.";
  } else {
    const minutes = Math.ceil(left / 60);
    description = `There were too many failed sign-in attempts for this account, so we've paused sign-in. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }

  return (
    <AccountStatePanel
      tone="warn"
      eyebrow="Sign-in paused"
      title={
        <>
          Sign-in is <Accent>locked</Accent> for now.
        </>
      }
      description={description}
      actions={
        <>
          <Link
            href="/login"
            prefetch={false}
            className={open ? "btn-primary-v2" : "btn-ghost-v2"}
            style={{ height: 38, padding: "0 16px" }}
          >
            Back to sign in
          </Link>
          <Link
            href="/forgot-password"
            className={open ? "btn-ghost-v2" : "btn-primary-v2"}
            style={{ height: 38, padding: "0 16px" }}
          >
            Reset password
          </Link>
        </>
      }
    >
      {until !== null && !open && (
        <Countdown label="Time until you can sign in again" value={formatCountdown(left)} />
      )}
      {!open && (
        <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "-12px auto 24px", maxWidth: "44ch" }}>
          Forgotten your password? You can reset it now, but you&apos;ll still
          need to wait for the pause to end before signing in.
        </p>
      )}
    </AccountStatePanel>
  );
}
