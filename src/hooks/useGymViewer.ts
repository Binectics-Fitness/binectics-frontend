"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { gymViewer, type GymViewer } from "@/lib/gymStaffNav";

/**
 * Who is looking at the gym dashboard. The owner sees everything; a gym's
 * staff (managers, assistants, admins, custom roles) see what their role's
 * permissions allow (lib/gymStaffNav).
 */
export function useGymViewer(): GymViewer & { staff: boolean; orgName: string | null; roleCode: string | null } {
  const { user } = useAuth();
  const { currentOrg: org } = useOrganization();
  const viewer = gymViewer(org, user?.id);
  return {
    ...viewer,
    // Someone in this gym's dashboard who doesn't own the gym.
    staff: !!org && !viewer.isOwner,
    orgName: org?.name ?? null,
    roleCode: org?.my_role_code ?? null,
  };
}
