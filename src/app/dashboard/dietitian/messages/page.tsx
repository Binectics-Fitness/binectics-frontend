import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import type { Metadata } from "next";
import InboxActivityPanel from "@/components/dashboard/InboxActivityPanel";

export const metadata: Metadata = {
  title: "Dietitian Messages",
  description: "Review dietitian inbox activity and nutrition-related updates.",
};

export default function DietitianMessagesPage() {
  return (
    <DietitianDashboardShell activeItem="Inbox" crumb="Messages">
      <InboxActivityPanel role="dietitian" />
    </DietitianDashboardShell>
  );
}
