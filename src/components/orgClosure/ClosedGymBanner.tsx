"use client";

import Link from "next/link";
import { daysLeftLabel, daysLeftToReopen, canReopenNow, type ClosedOrganization } from "@/lib/orgClosure/closure";

export const CLOSED_GYMS_HREF = "/dashboard/gym-owner/closed";

/** A strip across the dashboard: one of your gyms is closed. */
export function ClosedGymBanner({ gyms }: { gyms: ClosedOrganization[] }) {
  if (gyms.length === 0) return null;
  const first = gyms[0];
  const reopenable = gyms.some((g) => canReopenNow(g));
  const text =
    gyms.length === 1
      ? `${first.name} is closed. ${canReopenNow(first) ? daysLeftLabel(Math.max(1, daysLeftToReopen(first) ?? 1)) + "." : "Your records stay available to export."}`
      : `${gyms.length} of your gyms are closed.${reopenable ? " Some can still be reopened." : ""}`;
  return (
    <div
      role="status"
      className="rounded-(--r-3) px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      style={{ background: "var(--warn-soft)", border: "1px solid var(--warn)", color: "var(--warn-ink)" }}
    >
      <span className="text-[13.5px]">{text}</span>
      <Link href={CLOSED_GYMS_HREF} className="text-[13px] font-medium underline" style={{ color: "var(--warn-ink)" }}>
        Reopen or download records
      </Link>
    </div>
  );
}
