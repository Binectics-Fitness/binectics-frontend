import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { ProviderEarnings } from "@/components/ProviderEarnings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings",
  description: "Settled revenue and session activity",
};

/**
 * Real earnings, same two honest sections as the dietitian dashboard:
 * settled revenue off the org ledger, plus session counts with an
 * explicitly-labelled estimate of session value.
 */
export default function TrainerEarningsPage() {
  return (
    <TrainerDashboardShell activeItem="Earnings" crumb="Earnings">
      <ProviderEarnings settingsHref="/dashboard/trainer/settings" sessionNoun="session" />
    </TrainerDashboardShell>
  );
}
