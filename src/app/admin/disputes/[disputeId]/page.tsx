import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dispute",
  description: "Dispute detail",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminDisputeDetailPage() {
  return (
    <AdminDashboardShell activeItem={"Disputes"} crumb={"Dispute"}>
      <FeaturePending
        title={"Dispute"}
        subtitle={"Dispute detail"}
        pendingTitle={"Dispute detail is coming soon"}
        pendingBody={"There are no disputes yet \u2014 the disputes subsystem hasn't been built. This page previously showed fabricated dispute data."}
        cta={{ href: "/admin/disputes", label: "Back to disputes" }}
      />
    </AdminDashboardShell>
  );
}
