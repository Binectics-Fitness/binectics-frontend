import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Support ticket queue",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminTicketsPage() {
  return (
    <AdminDashboardShell activeItem={"Tickets"} crumb={"Tickets"}>
      <FeaturePending
        title={"Tickets"}
        subtitle={"Support ticket queue"}
        pendingTitle={"Support ticketing is coming soon"}
        pendingBody={"A support inbox with assignment and SLA tracking will appear here once the ticketing subsystem is built. This page previously showed fabricated tickets."}
      />
    </AdminDashboardShell>
  );
}
