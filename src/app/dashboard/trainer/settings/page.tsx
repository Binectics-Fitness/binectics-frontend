import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Practice preferences",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function TrainerSettingsPage() {
  return (
    <TrainerDashboardShell activeItem={"Settings"} crumb={"Settings"}>
      <FeaturePending
        title={"Settings"}
        subtitle={"Practice preferences"}
        pendingTitle={"Practice settings are coming soon"}
        pendingBody={"Trainer-specific preferences (availability defaults, session policies) will appear here once built. Your account settings \u2014 profile, password, notifications, privacy \u2014 are real and live today."}
        cta={{ href: "/dashboard/settings", label: "Open account settings" }}
      />
    </TrainerDashboardShell>
  );
}
