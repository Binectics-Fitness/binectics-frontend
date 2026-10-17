"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { coachingGym, gymStaffAccess, trainerAccess } from "@/lib/workspaces";

/**
 * The role guard for a provider dashboard. The trainer dashboard also admits
 * someone who owns a live trainer workspace without the trainer role: a gym
 * owner who coaches clients themselves keeps the gym owner role. The gym
 * dashboard also admits a gym's non-trainer staff (managers, assistants,
 * admins), who see only what their role allows (GymDashboardShell). Everyone
 * else is redirected to their own dashboard, as useRoleGuard does.
 */
export function useProviderAccess(role: UserRole) {
  const { user } = useAuth();
  const orgs = useOptionalOrganization();
  const loading = orgs?.isLoading ?? false;
  const extra =
    role === UserRole.TRAINER
      ? trainerAccess(user, orgs?.organizations, loading)
      : role === UserRole.GYM_OWNER && user?.role !== UserRole.GYM_OWNER
        ? gymStaffAccess(user, orgs?.organizations, loading)
        : { allowed: false, pending: false };
  return useRoleGuard(role, { allow: extra.allowed, pending: extra.pending });
}

/** Guard for every /dashboard/trainer page. */
export function useTrainerAccess() {
  return useProviderAccess(UserRole.TRAINER);
}

/**
 * The gym this trainer coaches at as its staff, or null for a trainer with a
 * practice of their own. Their clients, sessions and payments are the gym's.
 */
export function useCoachingGym() {
  const { user } = useAuth();
  const orgs = useOptionalOrganization();
  return coachingGym(orgs?.organizations, user?.id);
}
