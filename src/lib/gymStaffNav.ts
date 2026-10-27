/**
 * What a gym's staff see in the gym dashboard (discoverability F1).
 *
 * Managers, assistants, admins and custom roles work in the gym's dashboard,
 * filtered by the team permissions their role holds (`my_permissions` on the
 * org list). Each nav item and gym page names what its API routes ask for;
 * an item whose page the API would refuse is not shown, and a deep link to
 * one shows a single line saying who to ask.
 *
 * This only decides what to SHOW. It is never authority: every route checks
 * the caller itself (TeamPermissionsGuard, OrgOwnerGuard, service checks).
 */

/** Team permission slugs, as the API's TeamPermission enum spells them. */
export const TeamPermission = {
  VIEW_MEMBERS: "team:view_members",
  INVITE_MEMBER: "team:invite_member",
  REMOVE_MEMBER: "team:remove_member",
  UPDATE_MEMBER_ROLE: "team:update_member_role",
  DEACTIVATE_MEMBER: "team:deactivate_member",
  MANAGE_ROLES: "team:manage_roles",
  MANAGE_ORGANIZATION: "team:manage_organization",
  CANCEL_INVITATION: "team:cancel_invitation",
  VIEW_INVITATIONS: "team:view_invitations",
  VIEW_AUDIT_LOG: "team:view_audit_log",
  FORM_CREATE: "form:create",
  FORM_VIEW: "form:view",
  FORM_EDIT: "form:edit",
  FORM_DELETE: "form:delete",
  FORM_SUBMIT: "form:submit",
  PROGRESS_VIEW: "progress:view",
  PROGRESS_CREATE: "progress:create",
  PROGRESS_EDIT: "progress:edit",
  PROGRESS_DELETE: "progress:delete",
  PROGRESS_MANAGE_CLIENTS: "progress:manage_clients",
  PROGRESS_INVITE_CLIENT: "progress:invite_client",
  MARKETPLACE_MANAGE_LISTING: "marketplace:manage_listing",
  MARKETPLACE_VIEW_REQUESTS: "marketplace:view_requests",
  MARKETPLACE_RESPOND_REQUESTS: "marketplace:respond_requests",
  MARKETPLACE_MANAGE_REVIEWS: "marketplace:manage_reviews",
  BOOKINGS_MANAGE: "bookings:manage",
  MESSAGING_ANSWER_MEMBERS: "messaging:answer_members",
} as const;
export type TeamPermissionKey = (typeof TeamPermission)[keyof typeof TeamPermission];

/**
 * What a page needs: the owner only (money, billing, payment keys), or every
 * one of `all` (the permission(s) its loading routes ask for).
 */
export type GymAccessRule = { owner: true } | { all: readonly TeamPermissionKey[] };

const OWNER: GymAccessRule = { owner: true };
const needs = (...all: TeamPermissionKey[]): GymAccessRule => ({ all });

const P = TeamPermission;

/**
 * Nav item → what its page needs, for someone who doesn't own the gym. The
 * key is the item's name in GymDashboardShell's SIDEBAR. An item missing
 * here is owner-only, so a new item is hidden from staff until someone
 * decides otherwise. The API route behind each is in the comment.
 */
export const GYM_NAV_ACCESS: Readonly<Record<string, GymAccessRule>> = {
  // GET /checkins/organizations/:id/dashboard-stats, .../subscriptions
  Overview: needs(P.MARKETPLACE_MANAGE_LISTING),
  // GET /marketplace/organizations/:id/subscriptions and every member action
  Members: needs(P.MARKETPLACE_MANAGE_LISTING),
  // GET /teams/organizations/:id/classes (changing classes: manage_organization)
  Schedule: needs(P.VIEW_MEMBERS),
  // GET /marketplace/organizations/:id/requests (+ /pending-count). Answering
  // needs respond_requests, checked on the page's buttons.
  Requests: needs(P.MARKETPLACE_VIEW_REQUESTS),
  // GET /checkins/organizations/:id
  "Check‑ins": needs(P.MARKETPLACE_MANAGE_LISTING),
  // GET /checkins/organizations/:id/kiosk-token
  "Check-in kiosk": needs(P.MARKETPLACE_MANAGE_LISTING),
  // The owner's payout settings (owner-only on the API)
  Payouts: OWNER,
  // GET /checkins/organizations/:id/revenue-stats (+ the plan's analytics)
  Revenue: needs(P.MARKETPLACE_MANAGE_LISTING),
  // /refunds/organizations/:id/*, /disputes/*: owner only
  Refunds: OWNER,
  // /marketplace/organizations/:id/plans
  "Plans & pricing": needs(P.MARKETPLACE_MANAGE_LISTING),
  // The gym's listing, gallery, cover photo and publishing:
  // /marketplace/organizations/:id/listing* (manage_listing). Staff edit the
  // gym's listing there, never their own.
  "My listing": needs(P.MARKETPLACE_MANAGE_LISTING),
  // The page lists and creates the signed-in person's own forms, not the
  // gym's (the API's form:* routes are org-scoped, the page isn't yet).
  Forms: OWNER,
  // /loyalty/organizations/:id/*: reading the settings needs view_members;
  // turning it on or off and every reward route need manage_organization.
  Loyalty: needs(P.MANAGE_ORGANIZATION, P.VIEW_MEMBERS),
  // GET /teams/organizations/:id, .../members, .../roles
  "Team & roles": needs(P.VIEW_MEMBERS),
  // /marketplace/organizations/:id/assignment-rules
  "Assignment rules": needs(P.MARKETPLACE_MANAGE_LISTING),
  // /provider-billing/organizations/:id/*: owner only
  Billing: OWNER,
  // GET /teams/organizations/:id/locations (changing them: manage_organization)
  Locations: needs(P.VIEW_MEMBERS),
  // GET /teams/organizations/:id/members
  Staff: needs(P.VIEW_MEMBERS),
  // Gym inbox threads (MessagingService: owner or messaging:answer_members)
  Messages: needs(P.MESSAGING_ANSWER_MEMBERS),
  // Every section saves through manage_organization; the form loads from
  // GET /teams/organizations/:id (view_members) and the currency list from
  // price-currencies (manage_listing). Payment keys and payouts inside it are
  // owner-only and hidden from staff there.
  Settings: needs(P.MANAGE_ORGANIZATION, P.VIEW_MEMBERS, P.MARKETPLACE_MANAGE_LISTING),
};

const NAV = GYM_NAV_ACCESS;

/**
 * Gym pages by path → what they need, for deep links. Longest prefix wins;
 * the dashboard root matches only itself. Pages that share a nav item can
 * differ (the activity log under Settings). A gym page matching nothing
 * here is owner-only.
 */
export const GYM_PAGE_ACCESS: ReadonlyArray<readonly [string, GymAccessRule]> = [
  ["/dashboard/gym-owner", NAV.Overview],
  ["/dashboard/gym-owner/members", NAV.Members],
  // GET /marketplace/organizations/:id/member-billing/charges: owner only
  ["/dashboard/gym-owner/card-renewals", OWNER],
  ["/dashboard/gym-owner/schedule", NAV.Schedule],
  ["/dashboard/gym-owner/requests", NAV.Requests],
  ["/dashboard/gym-owner/checkins", NAV["Check‑ins"]],
  ["/dashboard/gym-owner/kiosk", NAV["Check-in kiosk"]],
  ["/dashboard/gym-owner/devices", NAV["Check-in kiosk"]],
  ["/dashboard/gym-owner/payouts", NAV.Payouts],
  ["/dashboard/gym-owner/revenue", NAV.Revenue],
  // GET .../revenue-stats, and the tax settings from GET /teams/organizations/:id
  ["/dashboard/gym-owner/tax", needs(P.MARKETPLACE_MANAGE_LISTING, P.VIEW_MEMBERS)],
  ["/dashboard/gym-owner/plans", NAV["Plans & pricing"]],
  ["/dashboard/gym-owner/locations", NAV.Locations],
  // GET /marketplace/my-listings + facility items (manage_listing)
  ["/dashboard/gym-owner/facility", needs(P.MARKETPLACE_MANAGE_LISTING)],
  ["/dashboard/gym-owner/staff", NAV.Staff],
  ["/dashboard/gym-owner/messages", NAV.Messages],
  ["/dashboard/gym-owner/settings", NAV.Settings],
  // GET /teams/organizations/:id/audit-log
  ["/dashboard/gym-owner/settings/activity", needs(P.VIEW_AUDIT_LOG)],
  // GET org listing (manage_listing); replying needs manage_reviews
  ["/dashboard/gym-owner/reviews", needs(P.MARKETPLACE_MANAGE_LISTING)],
  // The gym's own loyalty program, in the gym's workspace.
  ["/dashboard/gym-owner/loyalty", NAV.Loyalty],
  ["/dashboard/team", NAV["Team & roles"]],
  ["/dashboard/assignment-rules", NAV["Assignment rules"]],
  ["/dashboard/profile-edit", NAV["My listing"]],
  ["/dashboard/forms", NAV.Forms],
  // The shared loyalty page (members, trainers, dietitians); the gym nav
  // opens /dashboard/gym-owner/loyalty instead.
  ["/dashboard/loyalty", NAV.Loyalty],
  ["/dashboard/billing", NAV.Billing],
  ["/dashboard/refunds", NAV.Refunds],
];

const ROOT = "/dashboard/gym-owner";

/** Who is looking: the owner holds everything; staff hold their role's permissions. */
export interface GymViewer {
  isOwner: boolean;
  permissions: ReadonlySet<string>;
}

export function gymViewer(
  org: { is_owner?: boolean; owner_id?: unknown; my_permissions?: readonly string[] } | null | undefined,
  userId: string | null | undefined,
): GymViewer {
  // owner_id may arrive populated ({ _id }) from a single-org read.
  const ownerId =
    org?.owner_id && typeof org.owner_id === "object" ? String((org.owner_id as { _id?: unknown })._id ?? "") : String(org?.owner_id ?? "");
  const isOwner = !!org && !!userId && (org.is_owner ?? ownerId === userId);
  return { isOwner, permissions: new Set(org?.my_permissions ?? []) };
}

/** Whether the viewer may use what `rule` guards. */
export function allows(viewer: GymViewer, rule: GymAccessRule | undefined): boolean {
  if (viewer.isOwner) return true;
  if (!rule || "owner" in rule) return false;
  return rule.all.every((p) => viewer.permissions.has(p));
}

/** Whether the viewer holds one permission (the owner holds all). */
export function holds(viewer: GymViewer, permission: TeamPermissionKey): boolean {
  return viewer.isOwner || viewer.permissions.has(permission);
}

/**
 * Whether the viewer holds every permission of a role (or of a member's
 * role). The API refuses to grant, or to change the membership of someone
 * holding, a role with permissions the actor lacks (assertCanGrant,
 * assertCanManageMember), so those choices aren't offered.
 */
export function covers(viewer: GymViewer, permissions: readonly string[] | null | undefined): boolean {
  return viewer.isOwner || (permissions ?? []).every((p) => viewer.permissions.has(p));
}

/** The rule for a gym page path, or undefined (owner-only) when unknown. */
export function gymPageRule(pathname: string | null | undefined): GymAccessRule | undefined {
  if (!pathname) return undefined;
  const path = pathname.replace(/\/+$/, "") || "/";
  let best: readonly [string, GymAccessRule] | undefined;
  for (const entry of GYM_PAGE_ACCESS) {
    const [prefix] = entry;
    const hit = path === prefix || (prefix !== ROOT && path.startsWith(`${prefix}/`));
    if (hit && (!best || prefix.length > best[0].length)) {
      best = entry;
    }
  }
  return best?.[1];
}

/** The sidebar a viewer sees: items they can't use are dropped, then empty sections. */
export function gymSidebarFor<S extends { label: string; items: { name: string }[] }>(
  sections: readonly S[],
  viewer: GymViewer,
): S[] {
  if (viewer.isOwner) return [...sections];
  return sections
    .map((s) => ({ ...s, items: s.items.filter((item) => allows(viewer, GYM_NAV_ACCESS[item.name])) }))
    .filter((s) => s.items.length > 0);
}

/**
 * Where a staff member's gym dashboard starts: the first page in the nav
 * they can use (the owner's Overview for most; Schedule for an assistant).
 */
export function gymLandingHref(
  sections: readonly { items: readonly { name: string; href: string }[] }[],
  viewer: GymViewer,
): string {
  for (const s of sections) {
    for (const item of s.items) if (allows(viewer, GYM_NAV_ACCESS[item.name])) return item.href;
  }
  return ROOT;
}

/** The one line under the chip that says why a staff member's nav is shorter (F25 pattern). */
export function gymStaffNote(gymName: string): string {
  return `${gymName}'s owner manages billing, payouts and refunds. Your role decides the rest.`;
}

/** The line a staff member sees on a gym page their role doesn't cover. */
export function gymPageDeniedNote(gymName: string): string {
  return `Your role at ${gymName} doesn't include this page. Ask the gym's owner or an admin to change your role if you need it.`;
}
