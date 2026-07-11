import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance",
  description: "KYC and regulatory posture",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminCompliancePage() {
  return (
    <AdminDashboardShell activeItem={"Compliance"} crumb={"Compliance"}>
      <FeaturePending
        title={"Compliance"}
        subtitle={"KYC and regulatory posture"}
        pendingTitle={"Compliance tooling is coming soon"}
        pendingBody={"KYC queues and regulatory reporting will appear here once the compliance subsystem is built. This page previously showed fabricated statistics \u2014 no KYC pipeline exists yet."}
      />
    </AdminDashboardShell>
  );
}
