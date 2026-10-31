"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { paidContentOn } from "@/lib/paidContent/helpers";
import { ownsWorkspace } from "@/lib/workspaces";

/**
 * What the signed-in provider may do with paid programs and meal plans in the
 * workspace they are working in.
 *
 * - `on`: the paid_content flag for the CURRENT workspace, with the global
 *   value when there is none (see paidContentOn - the one rule for the app).
 * - `ownsWorkspace`: they own that workspace. Refunds are owner-only on the
 *   API (another's sale reads as missing, a 404).
 * - `canPrice`: pricing controls show. A gym's staff trainer works in the
 *   gym's workspace but is refused when setting prices (D10), so only the
 *   owner of the workspace gets them. With no workspace loaded the API decides.
 */
export function usePaidContentSeller() {
  const { user } = useAuth();
  const { isEnabled, isLoading } = useFeatureFlags();
  const org = useOptionalOrganization()?.currentOrg ?? null;
  const owns = ownsWorkspace(org, user?.id);
  return {
    on: paidContentOn(isEnabled, org?._id),
    flagsLoading: isLoading,
    ownsWorkspace: owns,
    canPrice: !org || owns,
  };
}
