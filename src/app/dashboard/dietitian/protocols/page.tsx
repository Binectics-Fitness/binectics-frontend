import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protocols",
  description: "Structured nutrition protocols",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function DietitianProtocolsPage() {
  return (
    <DietitianDashboardShell activeItem={"Protocols"} crumb={"Protocols"}>
      <FeaturePending
        title={"Protocols"}
        subtitle={"Structured nutrition protocols"}
        pendingTitle={"Protocols are coming soon"}
        pendingBody={"Reusable nutrition protocols will appear here once the protocols subsystem is built. This page previously showed fabricated protocols."}
      />
    </DietitianDashboardShell>
  );
}
