"use client";

import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { DSCard } from "@/components/ds";
import ConsultationAvailabilityManager from "@/components/ConsultationAvailabilityManager";
import { GatewaysSection } from "@/components/provider/GatewaysSection";
import { CancellationPolicyCard } from "@/components/provider/CancellationPolicyCard";
import { ActivityLogSection, canSeeActivityLog } from "@/components/activity/ActivityLogPanel";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { ShowSetupChecklist } from "@/components/provider/SetupChecklist";

export default function TrainerSettingsPage() {
  const gym = useCoachingGym();
  const { currentOrg } = useOrganization();
  return (
    <TrainerDashboardShell activeItem="Settings" crumb="Settings">
      {/* Only while the Today setup checklist is hidden: the way back. */}
      <ShowSetupChecklist where="Today" className="mb-8" />
      <ConsultationAvailabilityManager
        description={
          gym
            ? `Set the weekly hours the members you coach at ${gym.name} can book 1:1 sessions with you, plus any blocked dates.`
            : "Set the weekly hours members can book 1:1 sessions with you, plus any blocked dates. Members book from your marketplace listing."
        }
      />
      {/* A gym's trainer is paid through the gym: its payment account takes
          the money, so there is none of their own to connect. Membership
          plans otherwise charge on the org's own keys when connected, and
          can then use currencies that account has enabled. */}
      <div className="mt-8">
        {gym ? (
          <DSCard className="p-5.5">
            <section>
              <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Payment account</h2>
              <p className="text-[13px] mt-1" style={{ color: "var(--fg-3)" }}>
                You coach at {gym.name}, so payments for your sessions go to {gym.name}. Earnings shows the sessions you ran.
              </p>
            </section>
          </DSCard>
        ) : (
          <GatewaysSection
            title="Payment account"
            description="Connect your own payment account to collect membership plan payments directly, and to price plans in the currencies it has enabled. Secret keys are encrypted and never shown again."
          />
        )}
      </div>
      {/* Refunds on a gym's sessions follow the gym's policy, not theirs. */}
      {!gym && (
        <div className="mt-8">
          <CancellationPolicyCard />
        </div>
      )}
      {/* Their own workspace's log; a gym's staff trainer has none here. */}
      {!gym && canSeeActivityLog(currentOrg, true) && (
        <div className="mt-8">
          <ActivityLogSection href="/dashboard/trainer/settings/activity" />
        </div>
      )}
    </TrainerDashboardShell>
  );
}
