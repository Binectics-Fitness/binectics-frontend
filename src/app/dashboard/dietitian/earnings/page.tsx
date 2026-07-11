import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings",
  description: "Consultation revenue and payouts",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function DietitianEarningsPage() {
  return (
    <DietitianDashboardShell activeItem={"Earnings"} crumb={"Earnings"}>
      <FeaturePending
        title={"Earnings"}
        subtitle={"Consultation revenue and payouts"}
        pendingTitle={"Earnings reporting is coming soon"}
        pendingBody={"Consultation earnings, payout history, and summaries will appear here once provider earnings reporting is live. This page previously showed fabricated figures."}
      />
    </DietitianDashboardShell>
  );
}
