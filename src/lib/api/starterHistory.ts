import { apiClient } from "./client";
import { normalizeTask } from "./starter";
import { progressService, type ActivityReport, type ClientProfile } from "./progress";
import type { ApiResponse } from "@/lib/types";
import type { StarterHistoryDay } from "@/lib/starter/history";
import type { StarterTask } from "@/lib/starter/types";

/*
 * Reads for the Starter history page. Kept apart from starter.ts so the two
 * can change independently.
 *   GET /my-programs/:id/history?days=N   -> { days: [{ day, items: [occurrence] }] }, newest first
 *   GET /progress/my-profiles             -> the member's profiles (the self one holds their own log)
 *   GET /progress/clients/:id/activities  -> activity entries (the numbers they chose to log)
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

export function normalizeHistory(d: unknown): StarterHistoryDay[] | null {
  if (!isObj(d) || !Array.isArray(d.days)) return null;
  return d.days
    .filter(isObj)
    .map((x) => ({
      day: typeof x.day === "string" ? x.day : "",
      items: (Array.isArray(x.items) ? x.items : [])
        .map(normalizeTask)
        .filter((t): t is StarterTask => t !== null),
    }))
    .filter((x) => x.day !== "");
}

const idOf = (v: ClientProfile["client_id"] | ClientProfile["professional_id"] | null | undefined): string | null =>
  v == null ? null : typeof v === "string" ? v : (v._id ?? null);

/** The member's SELF profile (they are both client and professional), or null when they have none. */
export function selfProfileId(profiles: readonly ClientProfile[]): string | null {
  const self = profiles.find((p) => {
    const c = idOf(p.client_id);
    return !!c && c === idOf(p.professional_id);
  });
  return self?._id ?? null;
}

export const starterHistoryService = {
  /** The last `days` days of one program, grouped by day, newest first. */
  async getHistory(instanceId: string, days: number): Promise<ApiResponse<StarterHistoryDay[]>> {
    const res = await apiClient.get<unknown>(
      `/my-programs/${encodeURIComponent(instanceId)}/history?days=${days}`,
    );
    if (!res.success) return { ...res, data: undefined } as ApiResponse<StarterHistoryDay[]>;
    const out = normalizeHistory(res.data);
    return out ? { ...res, data: out } : { success: false, message: "Your history could not be read." };
  },

  /**
   * The member's own activity entries (up to 100). Reads the self profile;
   * never creates one, so a member who never logged anything gets [].
   */
  async getMyActivities(): Promise<ApiResponse<ActivityReport[]>> {
    const profiles = await progressService.getMyOwnProfiles();
    if (!profiles.success) return { ...profiles, data: undefined } as ApiResponse<ActivityReport[]>;
    const id = selfProfileId(profiles.data ?? []);
    if (!id) return { success: true, data: [] };
    return progressService.getActivityReports(id, 100);
  },
};
