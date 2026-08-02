import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { ProviderEarnings } from "@/components/ProviderEarnings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings",
  description: "Settled revenue and consultation activity",
};

export default function DietitianEarningsPage() {
  return (
    <DietitianDashboardShell activeItem="Earnings" crumb="Earnings">
      <ProviderEarnings settingsHref="/dashboard/dietitian/settings" sessionNoun="consultation" />
    </DietitianDashboardShell>
  );
}
