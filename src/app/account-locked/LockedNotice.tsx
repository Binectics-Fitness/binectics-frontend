"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AccountStatePanel, {
  Accent,
  Countdown,
  CountdownAnnouncement,
} from "@/components/AccountStatePanel";
import {
  countdownAnnouncement,
  formatCountdown,
  parseDeadline,
  parseLockScope,
  resetCanHelp,
  type LockScope,
} from "@/lib/routing/accountState";
import { useSecondsLeft } from "@/lib/routing/useSecondsLeft";

/** Who the pause is about, in words. Never blames the person. */
function reasonFor(scope: LockScope | null): string {
  if (scope === "device" || scope === "ip") {
    return "There were too many sign-in attempts from this device or network, so we've paused sign-in from here.";
  }
  if (scope === "email" || scope === "account") {
    return "There were too many failed sign-in attempts for this account, so we've paused sign-in.";
  }
  // Older API: no scope, so claim nothing about whose lock it is.
  return "There were too many failed sign-in attempts, so we've paused sign-in.";
}

/**
 * The login page sends a locked-out sign-in here with `until`, the moment
 * the API said sign-in reopens, and `scope`, whose lock it is. Without
 * `until` (opened directly) there is no timer to show, so none is invented.
 * "Reset password" is offered only where a reset can lift the lock: a device
 * or network lock gets a plain wait message instead.
 */
export default function LockedNotice() {
  const params = useSearchParams();
  const until = parseDeadline(params.get("until"));
  const scope = parseLockScope(params.get("scope"));
  const canReset = resetCanHelp(scope);
  const left = useSecondsLeft(until);
  const open = until !== null && left <= 0;

  let description: string;
  if (until === null) {
    description = `${reasonFor(scope)} Try again later.`;
  } else if (open) {
    description = "The pause is over. You can try signing in again.";
  } else {
    const minutes = Math.ceil(left / 60);
    description = `${reasonFor(scope)} Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
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
            className={open || !canReset ? "btn-primary-v2" : "btn-ghost-v2"}
            style={{ height: 38, padding: "0 16px" }}
          >
            Back to sign in
          </Link>
          {canReset && (
            <Link
              href="/forgot-password"
              className={open ? "btn-ghost-v2" : "btn-primary-v2"}
              style={{ height: 38, padding: "0 16px" }}
            >
              Reset password
            </Link>
          )}
        </>
      }
    >
      {until !== null && <CountdownAnnouncement text={countdownAnnouncement(left)} />}
      {until !== null && !open && (
        <Countdown label="Time until you can sign in again" value={formatCountdown(left)} />
      )}
      {!open && (
        <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "-12px auto 24px", maxWidth: "44ch" }}>
          {canReset
            ? "Forgotten your password? Resetting it usually ends the pause straight away. If sign-in is still paused afterwards, wait for the timer to finish."
            : "Resetting your password won't end this pause. Please wait for the timer to finish, then try again."}
        </p>
      )}
    </AccountStatePanel>
  );
}
