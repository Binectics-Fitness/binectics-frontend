"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { paidContentOn } from "@/lib/paidContent/helpers";
import { gymViewer, holds, TeamPermission } from "@/lib/gymStaffNav";
import { ownsWorkspace } from "@/lib/workspaces";

/**
 * What the signed-in provider may do with paid programs and meal plans in the
 * workspace they are working in.
 *
 * - `on`: the paid_content flag for the CURRENT workspace, with the global
 *   value when there is none (see paidContentOn - the one rule for the app).
 * - `ownsWorkspace`: they own that workspace. Refunds are owner-only on the
 *   API (another's sale reads as missing, a 404).
 * - `canPrice`: pricing controls show. The API (assertCanPrice) lets the
 *   workspace's owner OR anyone holding marketplace.manage_listing set prices
 *   (a gym's Admin or Manager), but not a staff trainer (D10). So the viewer's
 *   own permissions in this workspace (`my_permissions`) decide, the owner
 *   holding all. With no workspace loaded the API decides.
 */
export function usePaidContentSeller() {
  const { user } = useAuth();
  const { isEnabled, isLoading } = useFeatureFlags();
  const org = useOptionalOrganization()?.currentOrg ?? null;
  const owns = ownsWorkspace(org, user?.id);
  const canPrice = !org || holds(gymViewer(org, user?.id), TeamPermission.MARKETPLACE_MANAGE_LISTING);
  return {
    on: paidContentOn(isEnabled, org?._id),
    flagsLoading: isLoading,
    ownsWorkspace: owns,
    canPrice,
  };
}
