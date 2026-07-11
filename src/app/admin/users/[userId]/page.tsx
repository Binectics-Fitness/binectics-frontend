import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User detail",
  description: "Full account view",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminUserDetailPage() {
  return (
    <AdminDashboardShell activeItem={"Users"} crumb={"User detail"}>
      <FeaturePending
        title={"User detail"}
        subtitle={"Full account view"}
        pendingTitle={"The user detail view is coming soon"}
        pendingBody={"A full account view (profile, subscriptions, check-ins, actions) will appear here. The users list you came from is real; this detail page previously showed fabricated data."}
        cta={{ href: "/admin/users", label: "Back to users" }}
      />
    </AdminDashboardShell>
  );
}
