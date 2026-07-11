import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings",
  description: "Session revenue and payouts",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function TrainerEarningsPage() {
  return (
    <TrainerDashboardShell activeItem={"Earnings"} crumb={"Earnings"}>
      <FeaturePending
        title={"Earnings"}
        subtitle={"Session revenue and payouts"}
        pendingTitle={"Earnings reporting is coming soon"}
        pendingBody={"Per-session earnings, payout history, and summaries will appear here once provider earnings reporting is live. This page previously showed fabricated figures."}
      />
    </TrainerDashboardShell>
  );
}
