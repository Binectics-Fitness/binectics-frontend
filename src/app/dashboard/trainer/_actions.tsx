"use client";

import Link from "next/link";

/**
 * A trainer can't book a session for themselves — members book THEM. The
 * real provider action is publishing availability so those bookings can
 * happen. (Was a toast-only stub with no backend.)
 */
export function BookSessionButton() {
  return (
    <Link
      href="/dashboard/trainer/settings"
      className="btn-primary-v2 sm"
      style={{ textDecoration: "none" }}
    >
      Set availability
    </Link>
  );
}
