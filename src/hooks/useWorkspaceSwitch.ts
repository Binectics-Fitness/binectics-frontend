"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";
import { staffGym } from "@/lib/workspaces";

/** A link to another place the person works, for the account menus. */
export interface WorkspaceLink {
  href: string;
  label: string;
  onSelect?: () => void;
}

/**
 * The way between a gym staff member's own home and the gym's dashboard
 * (F1). Outside the gym dashboard: "{gym} workspace". Inside it, for staff:
 * back to their own home. Nothing for gym owners or anyone not on a gym's
 * staff.
 */
export function useWorkspaceSwitch(inGymDashboard: boolean): WorkspaceLink | null {
  const { user } = useAuth();
  const orgs = useOptionalOrganization();
  if (!user || user.role === UserRole.GYM_OWNER) return null;
  const gym = staffGym(orgs?.organizations, user.id, orgs?.currentOrg?._id);
  if (!gym) return null;
  if (inGymDashboard) {
    return {
      href: getDashboardRoute(user.role),
      label: user.role === UserRole.USER ? "Your member home" : "Your own dashboard",
    };
  }
  return {
    href: "/dashboard/gym-owner",
    label: `${gym.name} workspace`,
    onSelect: () => orgs?.setCurrentOrg(gym),
  };
}
