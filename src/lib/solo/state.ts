import { apiClient } from "@/lib/api/client";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";
import { progressService } from "@/lib/api/progress";
import type { ApiResponse, UserRole } from "@/lib/types";
import { isSoloMember } from "./rule";

/** One read that must succeed; a failure throws so the caller keeps its last answer. */
function need<T>(res: ApiResponse<T>, what: string): T | undefined {
  if (!res.success) throw new Error(res.message || `Could not read ${what}`);
  return res.data;
}

/** The list a source returned, or empty when it returned nothing. */
const list = <T>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

/**
 * GET /teams/invitations/mine: pending, unexpired team invitations sent to
 * this account. An API without the route answers 404: nothing to list, which
 * is not a failure.
 */
async function teamInvitationCount(): Promise<number> {
  const res = await apiClient.get<unknown[]>("/teams/invitations/mine");
  if (!res.success && res.status === 404) return 0;
  return list(need(res, "team invitations")).length;
}

/**
 * Whether the signed-in account is solo, from the same seven reads as the
 * mobile app. ALL must answer: one failing source throws (leaving the layout
 * as it was) rather than guessing "no providers".
 */
export async function readIsSolo(role: UserRole | null | undefined): Promise<boolean> {
  const [providers, requests, invitations, teamInvites, offers, subs, stats] = await Promise.all([
    marketplaceService.getMyProviders(),
    progressService.getMyPendingClientRequests(),
    progressService.getMyReceivedInvitations(),
    teamInvitationCount(),
    marketplaceService.getMyEnrollmentOffers(),
    marketplaceService.getMyMembershipSubscriptions(),
    checkinsService.getMyDashboardStats(),
  ]);
  const p = need(providers, "your providers");
  const providerCount = list(p?.professionals).length + list(p?.gyms).length;
  const offerList = list(need(offers, "membership offers"));
  const pendingOffers = offerList.filter(
    (o) => !(o as { status?: string }).status || (o as { status?: string }).status === "pending",
  );
  return isSoloMember({
    role,
    providerCount,
    pendingCount:
      list(need(requests, "requests")).length +
      list(need(invitations, "invitations")).length +
      teamInvites +
      pendingOffers.length,
    subscriptionStatuses: list(need(subs, "memberships")).map((s) => s.status),
    totalCheckIns: need(stats, "check-ins")?.total_check_ins ?? 0,
  });
}
