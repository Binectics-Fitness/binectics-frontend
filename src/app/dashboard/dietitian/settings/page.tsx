"use client";

import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";

export default function DietitianSettingsPage() {
  return (
    <DietitianDashboardShell activeItem="Settings" crumb="Availability">
      <ConsultationAvailabilityManager description="Set the weekly hours members can book consultations with you, plus any blocked dates. Members book from your marketplace listing." />
    </DietitianDashboardShell>
  );
}
