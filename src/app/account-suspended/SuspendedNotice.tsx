"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import AccountStatePanel, {
  Accent,
  type AccountStateRow,
} from "@/components/AccountStatePanel";
import {
  parseSuspensionNotice,
  readSuspensionNoticeRaw,
} from "@/lib/routing/accountState";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Shows only what the API told the account's owner on their refused
 * sign-in: the reason an admin recorded and when, when it has them.
 * Reached directly (no sign-in in this tab) it shows the generic copy.
 */
// The notice is written once, before navigating here; nothing changes it
// while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {};

export default function SuspendedNotice() {
  // sessionStorage exists only in the browser: the server snapshot is null.
  const raw = useSyncExternalStore(subscribe, readSuspensionNoticeRaw, () => null);
  const notice = useMemo(() => parseSuspensionNotice(raw), [raw]);

  const rows: AccountStateRow[] = [];
  if (notice?.reason) rows.push({ label: "Reason", value: notice.reason });
  if (notice?.suspendedAt) {
    rows.push({ label: "Suspended", value: formatDate(notice.suspendedAt) });
  }

  return (
    <AccountStatePanel
      tone="danger"
      eyebrow="Account suspended"
      title={
        <>
          Your account is <Accent>suspended</Accent>.
        </>
      }
      description="You can't sign in while your account is suspended. If you think this is a mistake, contact us and include the email address you sign in with."
      rows={rows}
      actions={
        <>
          <Link href="/contact" className="btn-primary-v2" style={{ height: 38, padding: "0 16px" }}>
            Contact us
          </Link>
          <Link href="/" className="btn-ghost-v2" style={{ height: 38, padding: "0 16px" }}>
            Back to home
          </Link>
        </>
      }
    />
  );
}
