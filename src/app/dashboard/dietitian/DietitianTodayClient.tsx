"use client";

import { useEffect, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { DSStatCard } from "@/components/ds";
import { NewPlanButton } from "./_actions";
import { CoachToday } from "../trainer/_components/CoachToday";
import { progressService, type DashboardStats } from "@/lib/api/progress";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";

export default function DietitianTodayClient() {
  // Role guard: wrong-role accounts get redirected to their own dashboard.
  const { isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  if (!isAuthorized) return null;
  return <DietitianTodayContent />;
}

function DietitianTodayContent() {
  // Practice stats (/progress/dashboard-stats). Optional: on failure the
  // cards are simply absent, and the page's own error rule (both list calls
  // failing) still decides whether to show the failure banner.
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let active = true;
    const kick = window.setTimeout(() => {
      progressService
        .getDashboardStats()
        .then((res) => {
          if (active && res.success && res.data) setStats(res.data);
        })
        .catch(() => {});
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  // Active / total clients are already on the page from the client list.
  const extraStats = stats
    ? [
        <DSStatCard key="requests" label="Pending requests" value={stats.pending_requests} delta="Client requests to answer" />,
        <DSStatCard key="invites" label="Pending invitations" value={stats.pending_invitations} delta="Invites not yet accepted" />,
      ]
    : [];

  return (
    <DietitianDashboardShell activeItem="Today" crumb="Today" actions={<NewPlanButton />}>
      <CoachToday
        noun="consult"
        calendarHref="/dashboard/dietitian/calendar"
        clientsHref="/dashboard/dietitian/clients"
        clientHref={(id) => `/dashboard/dietitian/clients/${id}`}
        extraStats={extraStats}
      />
    </DietitianDashboardShell>
  );
}
