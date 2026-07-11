import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disputes",
  description: "Member\u2013provider dispute resolution",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminDisputesPage() {
  return (
    <AdminDashboardShell activeItem={"Disputes"} crumb={"Disputes"}>
      <FeaturePending
        title={"Disputes"}
        subtitle={"Member\u2013provider dispute resolution"}
        pendingTitle={"Dispute handling is coming soon"}
        pendingBody={"Dispute intake, evidence, and resolution workflows will appear here once the disputes subsystem is built. This page previously showed fabricated disputes."}
      />
    </AdminDashboardShell>
  );
}
