import {
  MemberStatus,
  type OrganizationMember,
} from "@/lib/api/teams";
import { toneColors, type Tone } from "@/lib/ui/tones";

/**
 * Search + status filtering for the staff roster.
 *
 * Pure and colocated (not exported from page.tsx — Next app-router pages
 * may only export the route's own contract) so the matching rules can be
 * unit-tested without rendering the page.
 */

export type StatusFilter = "All" | "Active" | "Pending" | "Inactive";

export const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Active",
  "Pending",
  "Inactive",
];

const FILTER_TO_STATUS: Record<Exclude<StatusFilter, "All">, MemberStatus> = {
  Active: MemberStatus.ACTIVE,
  Pending: MemberStatus.PENDING,
  Inactive: MemberStatus.INACTIVE,
};

export function memberDisplayName(m: OrganizationMember): string {
  if (typeof m.user_id === "object" && m.user_id !== null) {
    return `${m.user_id.first_name} ${m.user_id.last_name}`.trim();
  }
  return "Member";
}

export function memberDisplayEmail(m: OrganizationMember): string {
  if (typeof m.user_id === "object" && m.user_id !== null) {
    return m.user_id.email ?? "";
  }
  return "";
}

export function memberRoleLabel(m: OrganizationMember): string {
  if (typeof m.team_role_id === "object" && m.team_role_id !== null) {
    return m.team_role_id.name;
  }
  return "Member";
}

/** Case-insensitive match across name, email, and role. Blank query matches all. */
export function matchesQuery(m: OrganizationMember, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    memberDisplayName(m).toLowerCase().includes(q) ||
    memberDisplayEmail(m).toLowerCase().includes(q) ||
    memberRoleLabel(m).toLowerCase().includes(q)
  );
}

export function matchesStatus(
  m: OrganizationMember,
  filter: StatusFilter,
): boolean {
  if (filter === "All") return true;
  return m.status === FILTER_TO_STATUS[filter];
}

export function filterMembers(
  members: OrganizationMember[],
  query: string,
  filter: StatusFilter,
): OrganizationMember[] {
  return members.filter((m) => matchesStatus(m, filter) && matchesQuery(m, query));
}

/** Per-filter counts for the chip labels — always over the unfiltered roster. */
export function statusCounts(
  members: OrganizationMember[],
): Record<StatusFilter, number> {
  return {
    All: members.length,
    Active: members.filter((m) => m.status === MemberStatus.ACTIVE).length,
    Pending: members.filter((m) => m.status === MemberStatus.PENDING).length,
    Inactive: members.filter((m) => m.status === MemberStatus.INACTIVE).length,
  };
}

/** The staff member's user id, only when the reference is populated. */
export function memberUserId(m: OrganizationMember): string | null {
  if (typeof m.user_id === "object" && m.user_id !== null) return m.user_id._id;
  return null;
}

export function memberInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * A team member's status as a tone (lib/ui/tones): active is success, an
 * invite not yet accepted is waiting (warn), inactive is neutral.
 */
export const MEMBER_STATUS_TONE: Record<MemberStatus, Tone> = {
  [MemberStatus.ACTIVE]: "success",
  [MemberStatus.PENDING]: "warn",
  [MemberStatus.INACTIVE]: "neutral",
};

const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "Active",
  [MemberStatus.PENDING]: "Pending",
  [MemberStatus.INACTIVE]: "Inactive",
};

/** Pill colours for a team member's status, shared by the roster and the detail page. */
export const MEMBER_STATUS_STYLE: Record<
  MemberStatus,
  { color: string; bg: string; label: string; tone: Tone }
> = Object.fromEntries(
  Object.values(MemberStatus).map((status) => {
    const tone = MEMBER_STATUS_TONE[status];
    const { fill, ink } = toneColors(tone);
    return [status, { color: ink, bg: fill, label: MEMBER_STATUS_LABEL[status], tone }];
  }),
) as Record<MemberStatus, { color: string; bg: string; label: string; tone: Tone }>;
