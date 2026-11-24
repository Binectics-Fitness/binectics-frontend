import { Suspense } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { DraftFromLink } from "./DraftFromLink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message your gym, trainer and dietitian.",
};

export default function MessagesPage() {
  return (
    <MemberDashboardShell activeLabel="Messages">
      <Suspense fallback={null}>
        <DraftFromLink>
          <MessagingCenter emptyHint="Messages with your gym, trainer or dietitian appear here. Start one from their card on your home page." />
        </DraftFromLink>
      </Suspense>
    </MemberDashboardShell>
  );
}
