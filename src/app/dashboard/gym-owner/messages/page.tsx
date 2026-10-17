"use client";

import { Suspense } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AccountType } from "@/lib/types";
import { ownsWorkspace } from "@/lib/workspaces";

export default function GymOwnerMessagesPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  // Only the owner of a gym posts announcements (the API refuses anyone else).
  const isOwner =
    !!currentOrg && currentOrg.account_type === AccountType.GYM_OWNER && ownsWorkspace(currentOrg, user?.id);
  const broadcastOrg = isOwner && currentOrg ? { id: currentOrg._id, name: currentOrg.name } : null;
  return (
    <GymDashboardShell activeItem="Messages" crumb="Messages">
      <Suspense fallback={null}>
        {isOwner ? (
          <MessagingCenter
            broadcastOrg={broadcastOrg}
            emptyHint="Conversations with your members and staff appear here. Start one from a member's or staff profile, or post an announcement."
          />
        ) : (
          // A gym's staff answer the gym's inbox here, as the gym. Their own
          // conversations stay in Messages on their member home.
          <MessagingCenter
            gymInboxOf={currentOrg?._id ?? null}
            emptyHint={`Messages members send ${currentOrg?.name ?? "the gym"} appear here, and you reply as the gym.`}
          />
        )}
      </Suspense>
    </GymDashboardShell>
  );
}
