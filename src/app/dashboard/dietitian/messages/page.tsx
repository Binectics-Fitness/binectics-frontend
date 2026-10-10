import { Suspense } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dietitian Messages",
  description: "Message your clients.",
};

export default function DietitianMessagesPage() {
  return (
    <DietitianDashboardShell activeItem="Inbox" crumb="Messages">
      <Suspense fallback={null}>
        <MessagingCenter emptyHint="Conversations with your clients appear here. Start one from a client's profile." />
      </Suspense>
    </DietitianDashboardShell>
  );
}
