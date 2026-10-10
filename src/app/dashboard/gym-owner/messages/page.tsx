"use client";

import { Suspense } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AccountType } from "@/lib/types";

export default function GymOwnerMessagesPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  // Only the owner of a gym posts announcements (the API refuses anyone else).
  const broadcastOrg =
    currentOrg && currentOrg.account_type === AccountType.GYM_OWNER && currentOrg.owner_id === user?.id
      ? { id: currentOrg._id, name: currentOrg.name }
      : null;
  return (
    <GymDashboardShell activeItem="Messages" crumb="Messages">
      <Suspense fallback={null}>
        <MessagingCenter
          broadcastOrg={broadcastOrg}
          emptyHint="Conversations with your members and staff appear here. Start one from a member's or staff profile, or post an announcement."
        />
      </Suspense>
    </GymDashboardShell>
  );
}
