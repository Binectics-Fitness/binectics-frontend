import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import type { Metadata } from "next";
import InboxActivityPanel from "@/components/dashboard/InboxActivityPanel";

export const metadata: Metadata = {
  title: "Trainer Messages",
  description: "Review trainer inbox activity and client-related updates.",
};

export default function TrainerMessagesPage() {
  return (
    <TrainerDashboardShell activeItem="Inbox" crumb="Messages">
      <InboxActivityPanel role="trainer" />
    </TrainerDashboardShell>
  );
}
