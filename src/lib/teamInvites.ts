import type { ApiResponse } from "@/lib/types";
import type { MyTeamInvitation } from "@/lib/api/teams";

/**
 * Why answering a team invitation by its id failed (the same reading as the
 * mobile app's utils/teamInvites.ts):
 * - "not-found": not this account's, or gone (404).
 * - "already-member": on the team already, or accepted before (409).
 * - "closed": expired, withdrawn by the gym, or declined (410).
 * - "full": the gym has no staff seats left (403 BILLING_LIMIT_REACHED).
 * - "unverified": the account's email is not verified (403).
 * - "other": anything else, offline included.
 */
export type TeamInviteFailureKind = "not-found" | "already-member" | "closed" | "full" | "unverified" | "other";

export interface TeamInviteFailure {
  kind: TeamInviteFailureKind;
  message: string;
}

/** The staff cap's own refusal text, which speaks to the gym owner. */
const PLAN_LIMIT_WORDING = /plan['’]s limit|plan doesn['’]t include|upgrade your plan/i;

/** What a refused accept or decline means, with copy for the invitee. */
export function teamInviteFailure(res: ApiResponse<unknown>, gym: string, fallback: string): TeamInviteFailure {
  const full = `${gym} has no staff seats left. Ask them to free one or upgrade their plan, then try again.`;
  if (res.code === "BILLING_LIMIT_REACHED") return { kind: "full", message: full };
  // Never show the invitee the owner-facing "Upgrade your plan" wording.
  if (res.status === 403 && PLAN_LIMIT_WORDING.test(res.message ?? "")) return { kind: "full", message: full };
  if (res.code === "AUTH_EMAIL_NOT_VERIFIED") {
    return { kind: "unverified", message: "Verify your email address first, then try again." };
  }
  switch (res.status) {
    case 404:
      return {
        kind: "not-found",
        message: "This invitation isn't on your account. If it was sent to another email address, use the link in that email.",
      };
    case 409:
      return { kind: "already-member", message: res.message || `You're already on ${gym}'s team.` };
    case 410:
      return { kind: "closed", message: res.message || "This invitation is no longer open." };
    default:
      return { kind: "other", message: res.message || fallback };
  }
}

/** Failures after which the invitation can't be answered here any more. */
export function teamInviteIsGone(kind: TeamInviteFailureKind): boolean {
  return kind === "not-found" || kind === "already-member" || kind === "closed";
}

/**
 * The role line for an invitation: the workspace's own name for the role,
 * else "Trainer" for the trainer role (consultant), else nothing.
 */
export function teamInviteRole(invitation: Pick<MyTeamInvitation, "role_code" | "role_name">): string | null {
  if (invitation.role_name) return invitation.role_name;
  if (invitation.role_code === "consultant") return "Trainer";
  return null;
}
