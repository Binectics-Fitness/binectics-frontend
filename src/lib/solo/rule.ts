import { MembershipSubscriptionStatus, UserRole } from "@/lib/types";

/**
 * Solo member: someone using Binectics on their own. The rule, in one place,
 * identical to the mobile app's (binectics-mobile src/utils/solo.ts).
 *
 * An account is solo when ALL of these hold, from data the web already reads
 * (nothing new on the server):
 *   1. its role is a plain member (UserRole.USER), not a coach, gym or admin;
 *   2. it has no provider relationship: GET /marketplace/my-providers (the
 *      trainers, dietitians and gyms the member belongs to) is empty;
 *   3. nobody is waiting on its answer: no coaching request, client
 *      invitation, team invitation or gym membership offer is pending;
 *   4. it has no membership that is still live: every subscription is
 *      expired or cancelled (a paused, past-due or unpaid one still counts);
 *   5. it has never checked in anywhere (total_check_ins === 0).
 *
 * Any of those becoming false (a request accepted, a gym joined, a check-in)
 * makes the account not solo, and the next read switches the app back.
 */
export interface SoloInputs {
  role: UserRole | null | undefined;
  providerCount: number;
  pendingCount: number;
  subscriptionStatuses: readonly MembershipSubscriptionStatus[];
  totalCheckIns: number;
}

/** A membership that is still a live relationship (not expired or cancelled). */
export function isOngoing(status: MembershipSubscriptionStatus): boolean {
  return (
    status !== MembershipSubscriptionStatus.EXPIRED &&
    status !== MembershipSubscriptionStatus.CANCELLED
  );
}

export function isSoloMember(input: SoloInputs): boolean {
  return (
    input.role === UserRole.USER &&
    input.providerCount === 0 &&
    input.pendingCount === 0 &&
    !input.subscriptionStatuses.some(isOngoing) &&
    input.totalCheckIns === 0
  );
}
