import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feature flags",
  description: "Runtime feature toggles",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminFeatureFlagsPage() {
  return (
    <AdminDashboardShell activeItem={"Feature flags"} crumb={"Feature flags"}>
      <FeaturePending
        title={"Feature flags"}
        subtitle={"Runtime feature toggles"}
        pendingTitle={"Feature flags are coming soon"}
        pendingBody={"A flag registry with per-environment rollout will appear here once the feature-flag subsystem is built. This page previously showed fabricated flags \u2014 no runtime flag system exists yet."}
      />
    </AdminDashboardShell>
  );
}
