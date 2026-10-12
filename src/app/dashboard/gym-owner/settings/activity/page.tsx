"use client";

import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { WorkspaceActivityLog } from "@/components/activity/ActivityLogPanel";

export default function GymActivityLogPage() {
  return (
    <GymDashboardShell activeItem="Settings" crumb="Activity log">
      <WorkspaceActivityLog settingsHref="/dashboard/gym-owner/settings" />
    </GymDashboardShell>
  );
}
