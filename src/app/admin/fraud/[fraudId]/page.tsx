import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fraud case",
  description: "Case detail",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminFraudDetailPage() {
  return (
    <AdminDashboardShell activeItem={"Fraud"} crumb={"Fraud case"}>
      <FeaturePending
        title={"Fraud case"}
        subtitle={"Case detail"}
        pendingTitle={"Fraud case detail is coming soon"}
        pendingBody={"There are no fraud cases yet \u2014 the fraud subsystem hasn't been built. This page previously showed fabricated case data."}
        cta={{ href: "/admin/fraud", label: "Back to fraud" }}
      />
    </AdminDashboardShell>
  );
}
