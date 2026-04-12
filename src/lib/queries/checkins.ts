import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { checkinsService } from "@/lib/api/checkins";
import type {
  OrgCheckInDashboardStats,
  MyCheckInDashboardStats,
  CheckIn,
  CheckInHistoryPeriod,
} from "@/lib/types";

export function useOrgDashboardStats(orgId?: string) {
  return useQuery<OrgCheckInDashboardStats | null>({
    queryKey: queryKeys.checkins.orgDashboardStats(orgId ?? ""),
    queryFn: async () => {
      const res = await checkinsService.getOrgDashboardStats(orgId!);
      return res.success && res.data ? res.data : null;
    },
    enabled: !!orgId,
  });
}

export function useMyCheckInStats(enabled = true) {
  return useQuery<MyCheckInDashboardStats | null>({
    queryKey: [...queryKeys.checkins.all, "myDashboardStats"],
    queryFn: async () => {
      const res = await checkinsService.getMyDashboardStats();
      return res.success && res.data ? res.data : null;
    },
    enabled,
  });
}

export function useMyCheckInHistory(
  period?: CheckInHistoryPeriod,
  enabled = true,
) {
  return useQuery<CheckIn[]>({
    queryKey: [...queryKeys.checkins.all, "myHistory", period ?? "all"],
    queryFn: async () => {
      const res = await checkinsService.getMyHistory(
        period === ("all" as string) ? undefined : period,
      );
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}
