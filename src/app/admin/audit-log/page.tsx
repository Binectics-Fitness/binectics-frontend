import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Security-relevant platform events",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminAuditLogPage() {
  return (
    <AdminDashboardShell activeItem={"Audit log"} crumb={"Audit log"}>
      <FeaturePending
        title={"Audit log"}
        subtitle={"Security-relevant platform events"}
        pendingTitle={"The audit log view is coming soon"}
        pendingBody={"Security events (logins, password changes, account deletions, check-in rejections) are logged by the API today; this page isn't wired to a queryable store yet \u2014 it previously showed fabricated entries."}
      />
    </AdminDashboardShell>
  );
}
