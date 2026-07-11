import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team & roles",
  description: "Platform admin team",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminTeamRolesPage() {
  return (
    <AdminDashboardShell activeItem={"Team & roles"} crumb={"Team & roles"}>
      <FeaturePending
        title={"Team & roles"}
        subtitle={"Platform admin team"}
        pendingTitle={"Platform team management is coming soon"}
        pendingBody={"Inviting platform admins with scoped permissions will appear here once platform-level roles are built. (Per-gym team roles already exist in each organization's Team page.) This page previously showed fabricated teammates."}
      />
    </AdminDashboardShell>
  );
}
