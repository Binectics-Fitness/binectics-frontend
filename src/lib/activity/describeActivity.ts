/**
 * Plain-language sentences for a workspace's activity log entries, e.g.
 * "Ada Obi changed Kemi Ola's role from Consultant / Trainer to Manager."
 *
 * Pure: everything comes from the allow-listed entry the API returns.
 */

import { MemberStatus, TeamPermission } from "@/lib/api/teams";
import {
  OrgAuditPersonKind,
  type OrgAuditEntry,
  type OrgAuditPerson,
} from "@/lib/api/orgAudit";

/** What each team permission lets someone do, for role-change sentences. */
export const PERMISSION_LABELS: Record<string, string> = {
  [TeamPermission.VIEW_MEMBERS]: "view the team",
  [TeamPermission.INVITE_MEMBER]: "invite members",
  [TeamPermission.REMOVE_MEMBER]: "remove members",
  [TeamPermission.UPDATE_MEMBER_ROLE]: "change members' roles",
  [TeamPermission.DEACTIVATE_MEMBER]: "deactivate members",
  [TeamPermission.MANAGE_ROLES]: "manage roles",
  [TeamPermission.MANAGE_ORGANIZATION]: "manage workspace settings",
  [TeamPermission.CANCEL_INVITATION]: "cancel invitations",
  [TeamPermission.VIEW_INVITATIONS]: "view invitations",
  [TeamPermission.VIEW_AUDIT_LOG]: "view the activity log",
  "form:create": "create forms",
  "form:view": "view forms",
  "form:edit": "edit forms",
  "form:delete": "delete forms",
  "form:submit": "submit forms",
  [TeamPermission.PROGRESS_VIEW]: "view client progress",
  [TeamPermission.PROGRESS_CREATE]: "log client progress",
  [TeamPermission.PROGRESS_EDIT]: "edit client progress",
  [TeamPermission.PROGRESS_DELETE]: "delete client progress",
  [TeamPermission.PROGRESS_MANAGE_CLIENTS]: "manage clients",
  [TeamPermission.PROGRESS_INVITE_CLIENT]: "invite clients",
  "marketplace:manage_listing": "manage the marketplace listing",
  "marketplace:view_requests": "view client requests",
  "marketplace:respond_requests": "respond to client requests",
  "marketplace:manage_reviews": "manage reviews",
};

const PAYOUT_FIELD_LABELS: Record<string, string> = {
  payout_schedule: "the payout schedule",
  preferred_payout_gateway: "the preferred payout gateway",
};

const GATEWAY_LABELS: Record<string, string> = {
  paystack: "Paystack",
  stripe: "Stripe",
  flutterwave: "Flutterwave",
};

export function gatewayLabel(gateway: string | undefined): string {
  if (!gateway) return "payment";
  return GATEWAY_LABELS[gateway] ?? gateway.charAt(0).toUpperCase() + gateway.slice(1);
}

function permissionLabel(p: string): string {
  return PERMISSION_LABELS[p] ?? p;
}

/** "a", "a and b", "a, b and c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function possessive(name: string): string {
  return `${name}'s`;
}

/** A subject in the middle of a sentence: "a former team member", not capitalised. */
function subjectName(subject: OrgAuditPerson | null): string {
  if (!subject) return "a team member";
  return subject.kind === OrgAuditPersonKind.FORMER_MEMBER ? "a former team member" : subject.name;
}

function roleOrUnknown(name: string | null | undefined): string {
  return name ?? "a role that no longer exists";
}

function statusChange(to: string | undefined): string {
  switch (to) {
    case MemberStatus.INACTIVE:
      return "deactivated";
    case MemberStatus.ACTIVE:
      return "reactivated";
    case MemberStatus.PENDING:
      return "set to pending";
    default:
      return "changed the status of";
  }
}

/** One sentence describing what happened, ending with a full stop. */
export function describeActivity(entry: OrgAuditEntry): string {
  const who = entry.actor.name;
  const d = entry.details;
  const subject = subjectName(entry.subject);
  const asRole = d.role_name ? ` as ${d.role_name}` : "";

  switch (entry.event) {
    case "TEAM_MEMBER_ADDED":
      return `${who} added ${subject} to the team${asRole}.`;

    case "TEAM_MEMBER_UPDATED": {
      const parts: string[] = [];
      const roleChanged = d.from_role_name !== undefined || d.to_role_name !== undefined;
      if (roleChanged) {
        parts.push(
          `changed ${possessive(subject)} role from ${roleOrUnknown(d.from_role_name)} to ${roleOrUnknown(d.to_role_name)}`,
        );
      }
      if (d.to_status !== undefined && d.from_status !== d.to_status) {
        parts.push(`${statusChange(d.to_status)} ${roleChanged ? "them" : subject}`);
      }
      if (parts.length === 0) return `${who} saved ${possessive(subject)} membership without changes.`;
      return `${who} ${parts.join(" and ")}.`;
    }

    case "TEAM_MEMBER_REMOVED":
      return `${who} removed ${subject} from the team${d.role_name ? ` (${d.role_name})` : ""}.`;

    case "TEAM_INVITATION_CREATED":
      return `${who} invited someone to join${asRole}.`;
    case "TEAM_INVITATION_ACCEPTED":
      return `${who} accepted an invitation and joined${asRole}.`;
    case "TEAM_INVITATION_CANCELLED":
      return `${who} cancelled an invitation to join${asRole}.`;
    case "TEAM_INVITATION_SUPERSEDED":
      return `${who} replaced an earlier invitation${asRole} with a new one.`;

    case "TEAM_STAFF_TRAINER_ACCOUNT_PROMOTED":
      return `${possessive(subject.charAt(0).toUpperCase() + subject.slice(1))} account was set up as a trainer account.`;

    case "TEAM_ROLE_CREATED": {
      const n = d.permissions?.length ?? 0;
      return `${who} created the ${d.role_name ?? "new"} role with ${n} permission${n === 1 ? "" : "s"}.`;
    }
    case "TEAM_ROLE_UPDATED": {
      const role = d.role_name ? `the ${d.role_name} role` : "a role";
      const added = (d.permissions_added ?? []).map(permissionLabel);
      const removed = (d.permissions_removed ?? []).map(permissionLabel);
      const changes: string[] = [];
      if (added.length) changes.push(`it can now ${joinList(added)}`);
      if (removed.length) changes.push(`it can no longer ${joinList(removed)}`);
      if (changes.length === 0) return `${who} saved ${role} without changing its permissions.`;
      return `${who} changed ${role}: ${changes.join("; ")}.`;
    }
    case "TEAM_ROLE_DELETED":
      return `${who} deleted ${d.role_name ? `the ${d.role_name} role` : "a custom role"}.`;

    case "ORG_PAYMENT_CONFIG_UPSERTED": {
      const gw = gatewayLabel(d.gateway);
      if (d.created) return `${who} connected a ${gw} payment account.`;
      const extras: string[] = [];
      if (d.public_key_changed) extras.push("changed its keys");
      if (d.is_active === false) extras.push("switched it off");
      return `${who} updated the ${gw} payment account${extras.length ? ` and ${joinList(extras)}` : ""}.`;
    }
    case "ORG_PAYMENT_CONFIG_REMOVED":
      return `${who} removed the ${gatewayLabel(d.gateway)} payment account.`;

    case "ORG_PAYOUT_SETTINGS_UPDATED": {
      const fields = (d.fields ?? []).map((f) => PAYOUT_FIELD_LABELS[f]).filter(Boolean);
      return `${who} changed ${fields.length ? joinList(fields) : "the payout settings"}.`;
    }

    case "PROVIDER_CURRENCY_VERIFIED":
      return `${who} added ${d.currency ?? "a currency"} to the ${gatewayLabel(d.gateway)} account's currencies.`;
    case "PROVIDER_CURRENCY_REMOVED":
      return `${who} removed ${d.currency ?? "a currency"} from the ${gatewayLabel(d.gateway)} account's currencies.`;
    case "PROVIDER_CURRENCIES_REFRESHED":
    case "PROVIDER_CURRENCIES_RECHECKED": {
      const notes: string[] = [];
      if (d.currencies_removed?.length) notes.push(`${joinList(d.currencies_removed)} removed`);
      if (d.currencies_missing?.length)
        notes.push(`${joinList(d.currencies_missing)} no longer enabled on the account`);
      return `${who} re-checked the ${gatewayLabel(d.gateway)} account's currencies${notes.length ? `: ${notes.join("; ")}` : ""}.`;
    }

    case "ORG_LOYALTY_SETTINGS_UPDATED":
      return d.enabled === undefined
        ? `${who} changed the loyalty programme.`
        : `${who} switched the loyalty programme ${d.enabled ? "on" : "off"}.`;

    default:
      return `${who}: ${entry.label}.`;
  }
}

// ─── Times ──────────────────────────────────────────────────────────────

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  if (Math.abs(seconds) < 45) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(Math.round(seconds / 60), "minute");
}

/** "9 Oct 2026, 14:05", in the viewer's locale and time zone. */
export function absoluteTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
