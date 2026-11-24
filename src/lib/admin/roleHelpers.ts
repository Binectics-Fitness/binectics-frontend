/**
 * Pure helpers behind the roles editor and the user page's Admin access card.
 */
import type { AdminPermission } from "./permissions";
import { AdminPermission as P, permissionLabel } from "./permissions";
import type {
  AdminAccessDiff,
  AdminPermissionGroup,
  AdminRole,
  AdminRoleHistoryItem,
} from "@/lib/api/adminRoles";

const ALL = Object.values(P) as AdminPermission[];

/**
 * The catalogue narrowed to items whose label, description or key contains
 * the query (any case). Groups left empty are dropped.
 */
export function filterCatalogue(groups: AdminPermissionGroup[], query: string): AdminPermissionGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.key.toLowerCase().includes(q) ||
          g.group.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.items.length > 0);
}

export type GroupState = "all" | "some" | "none";

/** How much of a group's `keys` are selected. */
export function groupState(keys: readonly string[], selected: ReadonlySet<string>): GroupState {
  const n = keys.filter((k) => selected.has(k)).length;
  return n === 0 ? "none" : n === keys.length ? "all" : "some";
}

/**
 * "Select all" for a group: when every grantable key is already on, turn them
 * all off; otherwise turn them all on. Keys the actor can't grant are left as
 * they are either way.
 */
export function toggleGroup(
  selected: ReadonlySet<AdminPermission>,
  grantable: readonly AdminPermission[],
): Set<AdminPermission> {
  const next = new Set(selected);
  const allOn = grantable.length > 0 && grantable.every((k) => next.has(k));
  for (const k of grantable) {
    if (allOn) next.delete(k);
    else next.add(k);
  }
  return next;
}

/** The permissions a role gives (the system role always gives every one). */
export function rolePermissions(role: Pick<AdminRole, "is_system" | "permissions">): AdminPermission[] {
  return role.is_system ? ALL : role.permissions;
}

/**
 * Whether the actor may give or take away this role: they must hold every
 * permission in it, and only a Super admin moves the system role.
 */
export function canAssignRole(
  role: Pick<AdminRole, "is_system" | "permissions">,
  can: (p: AdminPermission) => boolean,
  isSuper: boolean,
): boolean {
  if (role.is_system) return isSuper;
  return role.permissions.every((p) => can(p));
}

export interface AssignmentDiff {
  rolesAdded: AdminRole[];
  rolesRemoved: AdminRole[];
  permissionsAdded: AdminPermission[];
  permissionsRemoved: AdminPermission[];
  /** Nothing would change. */
  empty: boolean;
  /** After the change they hold no role and no direct permission: no longer an admin. */
  losesAccess: boolean;
}

/**
 * What setting a person's roles from `before` to `after` changes, worked out
 * from the roles list so it can be shown before saving. The API sends its
 * own diff back; this one is the preview.
 */
export function assignmentDiff(
  roles: AdminRole[],
  before: readonly string[],
  after: readonly string[],
  directPermissions: readonly AdminPermission[] = [],
): AssignmentDiff {
  const byId = new Map(roles.map((r) => [r.id, r]));
  const b = new Set(before);
  const a = new Set(after);
  const effective = (ids: Set<string>) => {
    const out = new Set<AdminPermission>(directPermissions);
    for (const id of ids) {
      const role = byId.get(id);
      if (role) rolePermissions(role).forEach((p) => out.add(p));
    }
    return out;
  };
  const eb = effective(b);
  const ea = effective(a);
  const order = (ps: AdminPermission[]) => ALL.filter((p) => ps.includes(p));
  const rolesAdded = [...a].filter((id) => !b.has(id)).map((id) => byId.get(id)).filter((r): r is AdminRole => !!r);
  const rolesRemoved = [...b].filter((id) => !a.has(id)).map((id) => byId.get(id)).filter((r): r is AdminRole => !!r);
  return {
    rolesAdded,
    rolesRemoved,
    permissionsAdded: order([...ea].filter((p) => !eb.has(p))),
    permissionsRemoved: order([...eb].filter((p) => !ea.has(p))),
    empty: rolesAdded.length === 0 && rolesRemoved.length === 0,
    losesAccess: a.size === 0 && directPermissions.length === 0,
  };
}

/**
 * Effective permissions grouped as the catalogue groups them, for the
 * collapsible list on the user page. Without a catalogue (it failed to load)
 * everything lands in one "Permissions" group with the fallback labels.
 */
export function groupPermissions(
  keys: readonly string[],
  catalogue: AdminPermissionGroup[] | undefined,
): { group: string; labels: string[] }[] {
  const held = new Set(keys);
  if (!catalogue?.length) {
    return keys.length ? [{ group: "Permissions", labels: keys.map(permissionLabel) }] : [];
  }
  const out = catalogue
    .map((g) => ({ group: g.group, labels: g.items.filter((i) => held.has(i.key)).map((i) => i.label) }))
    .filter((g) => g.labels.length > 0);
  const known = new Set(catalogue.flatMap((g) => g.items.map((i) => i.key as string)));
  const unknown = keys.filter((k) => !known.has(k));
  if (unknown.length) out.push({ group: "Other", labels: unknown.map(permissionLabel) });
  return out;
}

const personName = (p: { first_name?: string; last_name?: string } | null | undefined) =>
  p ? [p.first_name, p.last_name].filter(Boolean).join(" ").trim() : "";

/** Who made a history change, in words. */
export function historyActor(item: Pick<AdminRoleHistoryItem, "actor" | "actor_user_id">): string {
  return personName(item.actor) || (item.actor_user_id ? "A former admin" : "The system");
}

/** One history row as sentences: what happened, then what changed. */
export function describeRoleChange(
  item: Pick<AdminRoleHistoryItem, "event" | "diff">,
  label: (key: string) => string = permissionLabel,
): { title: string; lines: string[] } {
  const d: AdminAccessDiff = item.diff ?? { added: [], removed: [] };
  const added = (d.added ?? []).map(label);
  const removed = (d.removed ?? []).map(label);
  switch (item.event) {
    case "ADMIN_ROLE_CREATED":
      return {
        title: "Created the role",
        lines: added.length ? [`With ${added.length === 1 ? "1 permission" : `${added.length} permissions`}: ${added.join(", ")}`] : [],
      };
    case "ADMIN_ROLE_DELETED":
      return { title: "Deleted the role", lines: [] };
    case "ADMIN_ROLES_MIGRATED":
      return { title: "Set up by the roles migration", lines: added.length ? [`Permissions: ${added.join(", ")}`] : [] };
    default: {
      const lines: string[] = [];
      if (d.renamed) lines.push(`Renamed from “${d.renamed.from}” to “${d.renamed.to}”`);
      if (added.length) lines.push(`Added: ${added.join(", ")}`);
      if (removed.length) lines.push(`Removed: ${removed.join(", ")}`);
      return { title: lines.length ? "Edited the role" : "Edited the description", lines };
    }
  }
}
