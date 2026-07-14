import { Suspense } from "react";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Messages",
  description: "Message your clients.",
};

export default function TrainerMessagesPage() {
  return (
    <TrainerDashboardShell activeItem="Inbox" crumb="Messages">
      <Suspense fallback={null}>
        <MessagingCenter />
      </Suspense>
    </TrainerDashboardShell>
  );
}
