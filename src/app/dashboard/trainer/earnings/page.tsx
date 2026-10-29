import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { ProviderEarnings } from "@/components/ProviderEarnings";
import { MyAttributedEarnings } from "@/components/attributed/MyAttributedEarnings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings",
  description: "Settled revenue and session activity",
};

/**
 * Real earnings, same two honest sections as the dietitian dashboard:
 * settled revenue off the org ledger, plus session counts with an
 * explicitly-labelled estimate of session value. A trainer who coaches at a
 * gym also sees what the gym's ledger attributes to them.
 */
export default function TrainerEarningsPage() {
  return (
    <TrainerDashboardShell activeItem="Earnings" crumb="Earnings">
      <ProviderEarnings settingsHref="/dashboard/trainer/settings" sessionNoun="session" />
      <div className="mt-6">
        <MyAttributedEarnings />
      </div>
    </TrainerDashboardShell>
  );
}
