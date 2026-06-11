import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import type { Metadata } from "next";
import InboxActivityPanel from "@/components/dashboard/InboxActivityPanel";

export const metadata: Metadata = {
  title: "Messages",
  description: "Review your inbox activity and notifications.",
};

export default function MessagesPage() {
  return (
    <MemberDashboardShell activeLabel="Messages">
      <InboxActivityPanel role="member" />
    </MemberDashboardShell>
  );
}
