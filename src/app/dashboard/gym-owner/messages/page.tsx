"use client";

import { Suspense } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { MessagingCenter } from "@/components/messaging/MessagingCenter";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function GymOwnerMessagesPage() {
  const { currentOrg } = useOrganization();
  return (
    <GymDashboardShell activeItem="Messages" crumb="Messages">
      <Suspense fallback={null}>
        <MessagingCenter broadcastOrgId={currentOrg?._id ?? null} />
      </Suspense>
    </GymDashboardShell>
  );
}
