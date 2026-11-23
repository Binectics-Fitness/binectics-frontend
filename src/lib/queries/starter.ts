import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { starterService } from "@/lib/api/starter";
import { starterHistoryService } from "@/lib/api/starterHistory";
import { HISTORY_DAYS } from "@/lib/starter/history";
import { activeStarterProgram } from "@/lib/starter/model";
import type { ApiResponse } from "@/lib/types";
import type { StarterQuery } from "@/lib/starter/types";

/** Reads an ApiResponse for React Query: a failed read throws, so the page shows its error state. */
function unwrap<T>(res: ApiResponse<T>, fallback: string): T {
  if (!res.success || res.data === undefined) throw new Error(res.message || fallback);
  return res.data;
}

export function useStarterOptions(query: StarterQuery | null) {
  return useQuery({
    queryKey: queryKeys.starter.options(query ? `${query.goal}:${query.equipment}:${query.days}` : ""),
    enabled: !!query,
    queryFn: async () =>
      unwrap(await starterService.getOptions(query!), "Could not load the programs. Try again."),
    staleTime: 5 * 60_000,
  });
}

export function useStarterPreview(templateId: string | null) {
  return useQuery({
    queryKey: queryKeys.starter.preview(templateId ?? ""),
    enabled: !!templateId,
    queryFn: async () =>
      unwrap(await starterService.getPreview(templateId!), "Could not load the program. Try again."),
    staleTime: 5 * 60_000,
  });
}

/** The member's live starter program with its sessions, or null when there is none. */
export function useActiveStarter(enabled = true) {
  return useQuery({
    queryKey: queryKeys.starter.mine(),
    enabled,
    queryFn: async () => {
      const list = unwrap(await starterService.listMine(), "Could not load your program. Try again.");
      const live = activeStarterProgram(list);
      if (!live) return null;
      return unwrap(
        await starterService.getProgram(live.id),
        "Could not load your program. Try again.",
      );
    },
  });
}

/** The last HISTORY_DAYS days of one program, grouped by day. */
export function useStarterHistory(instanceId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.starter.history(instanceId ?? ""),
    enabled: !!instanceId,
    queryFn: async () =>
      unwrap(
        await starterHistoryService.getHistory(instanceId!, HISTORY_DAYS),
        "Could not load your history. Try again.",
      ),
  });
}

/** The member's own activity entries, for the numbers they chose to log. */
export function useStarterNumbers(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.starter.numbers(),
    enabled,
    queryFn: async () =>
      unwrap(await starterHistoryService.getMyActivities(), "Your numbers could not be loaded just now."),
  });
}
