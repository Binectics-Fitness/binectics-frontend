import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fraud",
  description: "Fraud signals and case management",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminFraudPage() {
  return (
    <AdminDashboardShell activeItem={"Fraud"} crumb={"Fraud"}>
      <FeaturePending
        title={"Fraud"}
        subtitle={"Fraud signals and case management"}
        pendingTitle={"Fraud monitoring is coming soon"}
        pendingBody={"Automated fraud signals, case queues, and account actions will appear here once the fraud subsystem is built. This page previously showed fabricated cases \u2014 no real signals exist yet."}
      />
    </AdminDashboardShell>
  );
}
