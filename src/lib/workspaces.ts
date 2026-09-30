import { AccountType } from "@/lib/types";

/**
 * Which workspace a dashboard works in, from the workspaces the person has.
 * The role alone does not say: a trainer may coach from a workspace they own
 * or, as a gym's staff trainer, from the gym's.
 */

/** A dashboard that works inside one kind of workspace. */
export type DashboardKind = "gym" | "trainer" | "dietitian";

export const DASHBOARD_ACCOUNT_TYPE: Record<DashboardKind, AccountType> = {
  gym: AccountType.GYM_OWNER,
  trainer: AccountType.PERSONAL_TRAINER,
  dietitian: AccountType.DIETITIAN,
};

/** The fields of an organization these helpers read. */
export interface WorkspaceLike {
  _id: string;
  owner_id: string;
  account_type?: AccountType | string;
  is_active?: boolean;
  /** The person's team role code here ('owner' for their own). */
  my_role_code?: string | null;
}

/**
 * The team role that makes a gym's staff member one of its trainers
 * ("Consultant / Trainer"). The API makes such an account a trainer.
 */
export const STAFF_TRAINER_ROLE_CODE = "consultant";

function isLive(org: WorkspaceLike): boolean {
  return org.is_active !== false;
}

/** The live workspace of this kind the person owns, if any. */
export function ownedWorkspace<T extends WorkspaceLike>(
  organizations: readonly T[] | null | undefined,
  kind: DashboardKind,
  userId: string | null | undefined,
): T | null {
  if (!userId) return null;
  const type = DASHBOARD_ACCOUNT_TYPE[kind];
  return (
    (organizations ?? []).find(
      (org) => org.account_type === type && org.owner_id === userId && isLive(org),
    ) ?? null
  );
}

/** What choosing a team role does, where it does more than set permissions. */
export function teamRoleHint(code: string | null | undefined): string | null {
  return code === STAFF_TRAINER_ROLE_CODE
    ? "Gets the trainer dashboard and the coach app, and coaches the members you assign them."
    : null;
}

/**
 * The gym this person coaches at as one of its trainers, if any: a live gym
 * someone else owns where their team role is the trainer role.
 */
export function coachingGym<T extends WorkspaceLike>(
  organizations: readonly T[] | null | undefined,
  userId: string | null | undefined,
): T | null {
  if (!userId) return null;
  return (
    (organizations ?? []).find(
      (org) =>
        isLive(org) &&
        org.account_type === AccountType.GYM_OWNER &&
        org.owner_id !== userId &&
        org.my_role_code === STAFF_TRAINER_ROLE_CODE,
    ) ?? null
  );
}

/**
 * Who may use the trainer dashboard: a trainer account, or anyone who owns a
 * live trainer workspace (a gym owner who also coaches). `pending` is true
 * while the answer still depends on workspaces that have not loaded.
 */
export function trainerAccess(
  user: { id: string; role: string } | null | undefined,
  organizations: readonly WorkspaceLike[] | null | undefined,
  organizationsLoading: boolean,
): { allowed: boolean; pending: boolean } {
  if (!user) return { allowed: false, pending: false };
  if (user.role === "TRAINER") return { allowed: true, pending: false };
  if (ownedWorkspace(organizations, "trainer", user.id)) return { allowed: true, pending: false };
  return { allowed: false, pending: organizationsLoading };
}

/**
 * The workspace a dashboard should work in. It keeps the current one when it
 * is already the right kind, else prefers one the person owns, else any of
 * that kind they belong to (staff). A gym's staff trainer, who has no
 * trainer workspace, works in the gym's on the trainer dashboard. The gym
 * and dietitian dashboards never fall back to a trainer workspace; with
 * nothing of their kind they take any other workspace (older records
 * without a type). Null means there is nothing better than what is
 * selected now.
 */
export function pickOrgForDashboard<T extends WorkspaceLike>(
  organizations: readonly T[] | null | undefined,
  kind: DashboardKind,
  opts: { userId?: string | null; currentId?: string | null },
): T | null {
  const orgs = (organizations ?? []).filter(isLive);
  const type = DASHBOARD_ACCOUNT_TYPE[kind];
  const ofKind = orgs.filter((org) => org.account_type === type);
  // A gym's staff trainer has no trainer workspace: they coach in the gym's.
  const staffGym = kind === "trainer" && ofKind.length === 0 ? coachingGym(orgs, opts.userId) : null;
  const candidates = staffGym
    ? [staffGym]
    : ofKind.length > 0 || kind === "trainer"
      ? ofKind
      : orgs.filter((org) => org.account_type !== AccountType.PERSONAL_TRAINER);
  if (candidates.length === 0) return null;
  const current = candidates.find((org) => org._id === opts.currentId);
  if (current) return current;
  return candidates.find((org) => org.owner_id === opts.userId) ?? candidates[0];
}

/** Which dashboard a path belongs to, when it belongs to one. */
export function dashboardKindForPath(pathname: string | null | undefined): DashboardKind | null {
  if (!pathname) return null;
  if (pathname === "/dashboard/trainer" || pathname.startsWith("/dashboard/trainer/")) return "trainer";
  if (pathname === "/dashboard/gym-owner" || pathname.startsWith("/dashboard/gym-owner/")) return "gym";
  if (pathname === "/dashboard/dietitian" || pathname.startsWith("/dashboard/dietitian/")) return "dietitian";
  return null;
}
