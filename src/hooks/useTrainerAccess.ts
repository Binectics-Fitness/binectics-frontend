"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { trainerAccess } from "@/lib/workspaces";

/**
 * The role guard for a provider dashboard. The trainer dashboard also admits
 * someone who owns a live trainer workspace without the trainer role: a gym
 * owner who coaches clients themselves keeps the gym owner role. Everyone
 * else is redirected to their own dashboard, as useRoleGuard does.
 */
export function useProviderAccess(role: UserRole) {
  const { user } = useAuth();
  const orgs = useOptionalOrganization();
  const extra =
    role === UserRole.TRAINER
      ? trainerAccess(user, orgs?.organizations, orgs?.isLoading ?? false)
      : { allowed: false, pending: false };
  return useRoleGuard(role, { allow: extra.allowed, pending: extra.pending });
}

/** Guard for every /dashboard/trainer page. */
export function useTrainerAccess() {
  return useProviderAccess(UserRole.TRAINER);
}
