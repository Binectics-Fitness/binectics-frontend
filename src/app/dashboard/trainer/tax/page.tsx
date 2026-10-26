import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { ProviderIncomeSummary } from "@/components/ProviderIncomeSummary";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax",
  description: "An informational summary of the money recorded through Binectics.",
};

/**
 * Tax: an informational income summary read off the workspace ledger. It
 * computes no tax and is not advice; nothing is filed on the provider's behalf.
 */
export default function TrainerTaxPage() {
  return (
    <TrainerDashboardShell activeItem="Earnings" crumb="Tax">
      <ProviderIncomeSummary settingsHref="/dashboard/trainer/settings" />
    </TrainerDashboardShell>
  );
}
