"use client";

import { use } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { HealthFormClient } from "./HealthFormClient";

/**
 * A gym's PAR-Q health form, filled in by the member (web parity with
 * mobile #273 HealthFormScreen). Reached from the "Health form" rows
 * (HealthFormRows) on the bookings page, and from Today once it mounts them.
 */
export default function HealthFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  if (!isAuthorized) return null;
  return (
    <MemberDashboardShell activeLabel="">
      <HealthFormClient id={id} />
    </MemberDashboardShell>
  );
}
