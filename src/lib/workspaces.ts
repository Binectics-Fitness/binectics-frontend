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
  /** Whether the person owns it (the API says so on the org list). */
  is_owner?: boolean;
  /**
   * The team permissions the person holds here (every one for the owner),
   * from the org list. For deciding what to show; every route still checks.
   */
  my_permissions?: readonly string[];
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

/**
 * Whether this person owns the workspace. Billing and refunds are owner-only
 * on the API, so their screens and nav counts check this first.
 */
export function ownsWorkspace(
  org: { owner_id?: string; is_owner?: boolean } | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (!org || !userId) return false;
  return org.is_owner ?? org.owner_id === userId;
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
 * The gym this person works at as non-trainer staff (a manager, assistant,
 * admin or custom role): a live gym someone else owns, where their role is
 * not the trainer role and holds at least one permission. Trainers get the
 * trainer dashboard instead (coachingGym). The first such gym, unless
 * `preferId` names another one.
 */
export function staffGym<T extends WorkspaceLike>(
  organizations: readonly T[] | null | undefined,
  userId: string | null | undefined,
  preferId?: string | null,
): T | null {
  if (!userId) return null;
  const gyms = (organizations ?? []).filter(
    (org) =>
      isLive(org) &&
      org.account_type === AccountType.GYM_OWNER &&
      org.owner_id !== userId &&
      org.is_owner !== true &&
      org.my_role_code !== STAFF_TRAINER_ROLE_CODE &&
      (org.my_permissions?.length ?? 0) > 0,
  );
  return gyms.find((org) => org._id === preferId) ?? gyms[0] ?? null;
}

/**
 * Who may use the gym dashboard besides a gym owner: a gym's non-trainer
 * staff. The dashboard then shows them only what their role allows
 * (lib/gymStaffNav). `pending` is true while workspaces are still loading.
 */
export function gymStaffAccess(
  user: { id: string; role: string } | null | undefined,
  organizations: readonly WorkspaceLike[] | null | undefined,
  organizationsLoading: boolean,
): { allowed: boolean; pending: boolean } {
  if (!user) return { allowed: false, pending: false };
  if (staffGym(organizations, user.id)) return { allowed: true, pending: false };
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
  // A gym's staff trainer works in the gym from the trainer dashboard, never
  // the gym dashboard.
  const ofKind = orgs.filter(
    (org) =>
      org.account_type === type &&
      !(kind === "gym" && org.owner_id !== opts.userId && org.my_role_code === STAFF_TRAINER_ROLE_CODE),
  );
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
  return (
    candidates.find((org) => org.owner_id === opts.userId) ??
    // A gym's staff on two teams: start in one where their role holds
    // something, not one that would show an empty nav.
    (kind === "gym" ? candidates.find((org) => (org.my_permissions?.length ?? 0) > 0) : undefined) ??
    candidates[0]
  );
}

/** Which dashboard a path belongs to, when it belongs to one. */
export function dashboardKindForPath(pathname: string | null | undefined): DashboardKind | null {
  if (!pathname) return null;
  if (pathname === "/dashboard/trainer" || pathname.startsWith("/dashboard/trainer/")) return "trainer";
  if (pathname === "/dashboard/gym-owner" || pathname.startsWith("/dashboard/gym-owner/")) return "gym";
  if (pathname === "/dashboard/dietitian" || pathname.startsWith("/dashboard/dietitian/")) return "dietitian";
  return null;
}

/** Where the invite-accept page sends someone who just joined a team. */
export interface InviteDestination {
  href: string;
  label: string;
  body: string;
  /** The workspace to make current before going there. */
  organizationId?: string;
}

/**
 * Where someone lands after accepting a team invitation: a gym's trainer on
 * the trainer dashboard; a gym's other staff in that gym's dashboard (which
 * shows what their role allows); anyone else on their own home. Never a page
 * that would bounce them, as /dashboard/team used to for non-owners.
 */
export function inviteDestination(
  user: { id: string; role: string } | null | undefined,
  organizations: readonly WorkspaceLike[] | null | undefined,
  joinedOrganizationId: string | null | undefined,
  homeHref: string,
): InviteDestination {
  if (user?.role === "TRAINER") {
    return {
      href: "/dashboard/trainer",
      label: "Go to your trainer dashboard",
      body: "You've joined the team as a trainer. Your trainer dashboard shows the members assigned to you, and the Binectics app opens as your coach app.",
    };
  }
  const joined = joinedOrganizationId
    ? (organizations ?? []).filter((org) => org._id === joinedOrganizationId)
    : organizations;
  const gym = staffGym(joined, user?.id) as (WorkspaceLike & { name?: string }) | null;
  if (gym) {
    const name = gym.name || "the gym";
    return {
      href: "/dashboard/gym-owner",
      label: `Open ${name}'s dashboard`,
      body: `You've joined ${name}'s team. Its dashboard shows the parts your role lets you work on.`,
      organizationId: gym._id,
    };
  }
  return {
    href: homeHref,
    label: "Go to your dashboard",
    body: "You've joined the team.",
  };
}
