import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments",
  description: "Platform-wide payment activity",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminPaymentsPage() {
  return (
    <AdminDashboardShell activeItem={"Payments"} crumb={"Payments"}>
      <FeaturePending
        title={"Payments"}
        subtitle={"Platform-wide payment activity"}
        pendingTitle={"The payments view is coming soon"}
        pendingBody={"Real transactions are recorded by the platform today; this page just isn't wired to them yet \u2014 it previously showed fabricated payments. Wiring it to the transactions service is next on the roadmap."}
      />
    </AdminDashboardShell>
  );
}
