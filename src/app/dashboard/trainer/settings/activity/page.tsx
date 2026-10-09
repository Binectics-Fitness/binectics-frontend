"use client";

import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { WorkspaceActivityLog } from "@/components/activity/ActivityLogPanel";

export default function TrainerActivityLogPage() {
  return (
    <TrainerDashboardShell activeItem="Settings" crumb="Activity log">
      <WorkspaceActivityLog settingsHref="/dashboard/trainer/settings" ownerOnly />
    </TrainerDashboardShell>
  );
}
