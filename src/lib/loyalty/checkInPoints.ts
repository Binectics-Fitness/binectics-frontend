import { useEffect, useState } from "react";
import { loyaltyService } from "@/lib/api/loyalty";
import { LoyaltyEventType, type LoyaltyPointsTransaction } from "@/lib/types";

/** How far before the check-in an award may be dated (clock skew between services). */
const POINTS_SKEW_MS = 2 * 60_000;
/** The API awards the points just after answering the scan; look once more after this. */
export const POINTS_RETRY_MS = 1500;

/**
 * The points this check-in earned, from the gym's own ledger: the newest
 * check-in award no older than the visit. Null when there is none (no
 * program, or the award hasn't landed yet): the line is then not drawn
 * rather than guessed. The same rule as mobile's check-in success.
 */
export function checkInPoints(history: readonly LoyaltyPointsTransaction[], since: number): number | null {
  const award = history
    .filter((t) => t.event_type === LoyaltyEventType.GYM_CHECK_IN && t.points > 0)
    .filter((t) => {
      const at = new Date(t.created_at).getTime();
      return Number.isFinite(at) && at >= since - POINTS_SKEW_MS;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return award ? award.points : null;
}

/**
 * "+10 points at Iron Lab" after a check-in (F14): one quiet line, only
 * where the gym runs its own loyalty program (providers opt in; there are
 * no platform rewards). The member's programs list is the gate; the number
 * is the ledger's. Null until known, and for every gym without a program.
 */
export function useCheckInPoints(organizationId: string | null, checkedInAt: string | null): string | null {
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    if (!organizationId) return undefined;
    const parsed = checkedInAt ? new Date(checkedInAt).getTime() : NaN;
    const since = Number.isFinite(parsed) ? parsed : Date.now();
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      const programs = await loyaltyService.getPrograms().catch(() => null);
      const program = programs?.success ? programs.data?.find((p) => p.organization_id === organizationId) : undefined;
      if (!program || !live) return;
      const look = async (retry: boolean) => {
        const res = await loyaltyService.getHistory(10, 0, organizationId).catch(() => null);
        if (!live) return;
        const points = checkInPoints(res?.success ? (res.data ?? []) : [], since);
        if (points) setLine(`+${points.toLocaleString()} points at ${program.organization_name || "this gym"}`);
        else if (retry) timer = setTimeout(() => void look(false), POINTS_RETRY_MS);
      };
      await look(true);
    })();
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [organizationId, checkedInAt]);
  return line;
}
