"use client";

import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { WorkspaceActivityLog } from "@/components/activity/ActivityLogPanel";

export default function DietitianActivityLogPage() {
  return (
    <DietitianDashboardShell activeItem="Settings" crumb="Activity log">
      <WorkspaceActivityLog settingsHref="/dashboard/dietitian/settings" ownerOnly />
    </DietitianDashboardShell>
  );
}
