import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Countries",
  description: "Market and country configuration",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminCountriesPage() {
  return (
    <AdminDashboardShell activeItem={"Countries"} crumb={"Countries"}>
      <FeaturePending
        title={"Countries"}
        subtitle={"Market and country configuration"}
        pendingTitle={"Country management UI is coming soon"}
        pendingBody={"Billing markets and localized pricing exist in the API today (managed via the provider-billing admin endpoints), but this page isn't wired to them yet. It previously showed fabricated country data."}
      />
    </AdminDashboardShell>
  );
}
