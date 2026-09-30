"use client";

import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import { GatewaysSection } from "@/components/provider/GatewaysSection";

export default function TrainerSettingsPage() {
  return (
    <TrainerDashboardShell activeItem="Settings" crumb="Settings">
      <ConsultationAvailabilityManager description="Set the weekly hours members can book 1:1 sessions with you, plus any blocked dates. Members book from your marketplace listing." />
      {/* Membership plans charge on the org's own keys when connected, and
          can then use currencies that account has enabled. */}
      <div className="mt-8">
        <GatewaysSection
          title="Payment account"
          description="Connect your own payment account to collect membership plan payments directly, and to price plans in the currencies it has enabled. Secret keys are encrypted and never shown again."
        />
      </div>
    </TrainerDashboardShell>
  );
}
