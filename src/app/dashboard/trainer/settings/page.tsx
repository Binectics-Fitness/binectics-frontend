"use client";

import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";

export default function TrainerSettingsPage() {
  return (
    <TrainerDashboardShell activeItem="Settings" crumb="Availability">
      <ConsultationAvailabilityManager description="Set the weekly hours members can book 1:1 sessions with you, plus any blocked dates. Members book from your marketplace listing." />
    </TrainerDashboardShell>
  );
}
