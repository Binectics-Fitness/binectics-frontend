import { AccountType } from "@/lib/types";

/**
 * One person can own more than one workspace: a gym owner may also coach
 * clients themselves from a trainer workspace. The account keeps its gym
 * owner role, so the role alone no longer says which workspace a dashboard
 * is about. These helpers answer that from the workspaces the person has.
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
}

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
 * that kind they belong to (staff). The gym and dietitian dashboards never
 * fall back to a trainer workspace; with nothing of their kind they take any
 * other workspace (older records without a type). Null means there is
 * nothing better than what is selected now.
 */
export function pickOrgForDashboard<T extends WorkspaceLike>(
  organizations: readonly T[] | null | undefined,
  kind: DashboardKind,
  opts: { userId?: string | null; currentId?: string | null },
): T | null {
  const orgs = (organizations ?? []).filter(isLive);
  const type = DASHBOARD_ACCOUNT_TYPE[kind];
  const ofKind = orgs.filter((org) => org.account_type === type);
  const candidates =
    ofKind.length > 0 || kind === "trainer"
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

/** The suggested name for a gym owner's own coaching workspace. */
export function defaultCoachingName(user: { first_name?: string; last_name?: string } | null | undefined): string {
  const name = [user?.first_name, user?.last_name].map((p) => p?.trim()).filter(Boolean).join(" ");
  return name ? `${name} Coaching` : "My Coaching";
}
