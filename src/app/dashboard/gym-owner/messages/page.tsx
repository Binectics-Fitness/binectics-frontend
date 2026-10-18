"use client";

import { Suspense } from "react";
import { AsyncSpinner } from "@/components/ds";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AccountType } from "@/lib/types";
import { ownsWorkspace } from "@/lib/workspaces";

export default function GymOwnerMessagesPage() {
  const { user } = useAuth();
  const { currentOrg, isLoading: isOrgLoading } = useOrganization();
  // Only the owner of a gym posts announcements (the API refuses anyone else).
  const isOwner =
    !!currentOrg && currentOrg.account_type === AccountType.GYM_OWNER && ownsWorkspace(currentOrg, user?.id);
  const broadcastOrg = isOwner && currentOrg ? { id: currentOrg._id, name: currentOrg.name } : null;
  return (
    <GymDashboardShell activeItem="Messages" crumb="Messages">
      <Suspense fallback={null}>
        {!currentOrg ? (
          // Until the workspace is known, neither inbox can be chosen: never
          // fall through to the person's own conversations meanwhile.
          isOrgLoading ? (
            <AsyncSpinner size="page" label="Loading messages" />
          ) : (
            <p className="p-8 text-center text-[14px]" style={{ color: "var(--fg-3)" }}>
              Choose a gym workspace to see its messages.
            </p>
          )
        ) : isOwner ? (
          <MessagingCenter
            broadcastOrg={broadcastOrg}
            emptyHint="Conversations with your members and staff appear here. Start one from a member's or staff profile, or post an announcement."
          />
        ) : (
          // A gym's staff answer the gym's inbox here, as the gym. Their own
          // conversations stay in Messages on their member home.
          <MessagingCenter
            gymInboxOf={currentOrg._id}
            emptyHint={`Messages members send ${currentOrg.name} appear here, and you reply as the gym.`}
          />
        )}
      </Suspense>
    </GymDashboardShell>
  );
}
