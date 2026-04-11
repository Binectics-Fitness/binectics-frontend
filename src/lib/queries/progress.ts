import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  progressService,
  type DashboardStats,
  type ClientProfile,
  type LatestWeight,
  type JournalPage,
  type ProgressSummary,
  type WorkoutPlan,
  type DietPlan,
  type ActivityReport,
  type MealFeedback,
  type Recommendation,
} from "@/lib/api/progress";

export function useDashboardStats(enabled = true) {
  return useQuery<DashboardStats | null>({
    queryKey: queryKeys.progress.dashboardStats(),
    queryFn: async () => {
      const res = await progressService.getDashboardStats();
      return res.success && res.data ? res.data : null;
    },
    enabled,
  });
}

export function useClientProfiles(orgId?: string, enabled = true) {
  return useQuery<ClientProfile[]>({
    queryKey: queryKeys.progress.clientProfiles(orgId),
    queryFn: async () => {
      const res = orgId
        ? await progressService.getOrgClientProfiles(orgId)
        : await progressService.getMyClientProfiles();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useLatestWeights(enabled = true) {
  return useQuery<Record<string, LatestWeight | null>>({
    queryKey: queryKeys.progress.latestWeights(),
    queryFn: async () => {
      const res = await progressService.getLatestWeights();
      return res.success && res.data ? res.data : {};
    },
    enabled,
  });
}

export function useClientInvitations(orgId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.progress.invitations(orgId),
    queryFn: async () => {
      const res = await progressService.getMyClientInvitations(orgId);
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useSentClientRequests(orgId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.progress.sentRequests(orgId),
    queryFn: async () => {
      const res = orgId
        ? await progressService.getOrgSentClientRequests(orgId)
        : await progressService.getSentClientRequests();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useMyJournalEntries(limit = 20, enabled = true) {
  return useQuery<JournalPage | null>({
    queryKey: [...queryKeys.progress.all, "myJournals", limit],
    queryFn: async () => {
      const res = await progressService.getMyJournalEntries(limit);
      return res.success && res.data ? res.data : null;
    },
    enabled,
  });
}

export function useMyOwnProfiles(enabled = true) {
  return useQuery<ClientProfile[]>({
    queryKey: queryKeys.progress.myOwnProfiles(),
    queryFn: async () => {
      const res = await progressService.getMyOwnProfiles();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useProgressSummary(
  clientProfileId: string,
  days = 30,
  enabled = true,
) {
  return useQuery<ProgressSummary | null>({
    queryKey: queryKeys.progress.progressSummary(clientProfileId, days),
    queryFn: async () => {
      const res = await progressService.getProgressSummary(
        clientProfileId,
        days,
      );
      return res.success && res.data ? res.data : null;
    },
    enabled: enabled && !!clientProfileId,
  });
}

export function useMyWorkoutPlans(enabled = true) {
  return useQuery<WorkoutPlan[]>({
    queryKey: queryKeys.progress.myWorkoutPlans(),
    queryFn: async () => {
      const res = await progressService.getMyWorkoutPlans();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useMyDietPlans(enabled = true) {
  return useQuery<DietPlan[]>({
    queryKey: queryKeys.progress.myDietPlans(),
    queryFn: async () => {
      const res = await progressService.getMyDietPlans();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useActivityReports(profileId: string, enabled = true) {
  return useQuery<ActivityReport[]>({
    queryKey: queryKeys.progress.activityReports(profileId),
    queryFn: async () => {
      const res = await progressService.getActivityReports(profileId);
      return res.success && res.data ? res.data : [];
    },
    enabled: enabled && !!profileId,
  });
}

export function useMealFeedbacks(profileId: string, enabled = true) {
  return useQuery<MealFeedback[]>({
    queryKey: queryKeys.progress.mealFeedbacks(profileId),
    queryFn: async () => {
      const res = await progressService.getMealFeedbacks(profileId);
      return res.success && res.data ? res.data : [];
    },
    enabled: enabled && !!profileId,
  });
}

export function useMyRecommendations(limit = 10, enabled = true) {
  return useQuery<Recommendation[]>({
    queryKey: queryKeys.progress.myRecommendations(limit),
    queryFn: async () => {
      const res = await progressService.getMyRecommendations(limit);
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function usePendingClientRequests(enabled = true) {
  return useQuery({
    queryKey: queryKeys.progress.pendingClientRequests(),
    queryFn: async () => {
      const res = await progressService.getMyPendingClientRequests();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function usePendingInvitations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.progress.pendingInvitations(),
    queryFn: async () => {
      const res = await progressService.getMyPendingInvitations();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useOrgDietPlans(orgId: string, enabled = true) {
  return useQuery<DietPlan[]>({
    queryKey: queryKeys.progress.orgDietPlans(orgId),
    queryFn: async () => {
      const res = await progressService.getProviderDietPlansInOrg(orgId);
      return res.success && res.data ? res.data : [];
    },
    enabled: enabled && !!orgId,
  });
}
