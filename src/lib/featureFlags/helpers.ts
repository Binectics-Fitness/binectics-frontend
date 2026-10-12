import type {
  AdminFeatureFlag,
  AdminFeatureFlagChange,
  EffectiveFeatureFlags,
  FeatureFlagOrg,
} from "@/lib/api/featureFlags";

/**
 * A flag's value for the caller, as GET /feature-flags/me reported it: the
 * organisation's value when one is given and the caller belongs to it,
 * otherwise the global value. Anything unknown is off, as on the server.
 */
export function effectiveFlag(
  data: EffectiveFeatureFlags | null | undefined,
  key: string,
  organizationId?: string | null,
): boolean {
  if (!data) return false;
  if (organizationId) {
    const org = data.organizations.find((o) => o.organization_id === organizationId);
    if (org && Object.prototype.hasOwnProperty.call(org.flags, key)) return org.flags[key] === true;
  }
  return Object.prototype.hasOwnProperty.call(data.flags, key) ? data.flags[key] === true : false;
}

export type FlagFilter = "all" | "on" | "off" | "overrides";

export function matchesFilter(flag: AdminFeatureFlag, filter: FlagFilter): boolean {
  switch (filter) {
    case "on":
      return flag.enabled;
    case "off":
      return !flag.enabled;
    case "overrides":
      return flag.overrides_on + flag.overrides_off > 0;
    default:
      return true;
  }
}

export function onOff(value: boolean): string {
  return value ? "On" : "Off";
}

export function orgLabel(org: FeatureFlagOrg | null | undefined): string {
  if (!org) return "Every organisation";
  return org.name ?? `Deleted organisation (${org.id.slice(-6)})`;
}

/** One history row as a sentence, e.g. "Turned on everywhere (was off)". */
export function describeChange(change: AdminFeatureFlagChange): string {
  if (change.action === "global_set") {
    const was = change.previous === null ? "" : ` (was ${onOff(change.previous).toLowerCase()})`;
    return `Turned ${onOff(change.value === true).toLowerCase()} everywhere${was}`;
  }
  const org = orgLabel(change.organization);
  if (change.action === "override_removed") {
    return `Removed the override for ${org}; it follows the global value again`;
  }
  const was =
    change.previous === null ? "" : ` (override was ${onOff(change.previous).toLowerCase()})`;
  return `Set ${onOff(change.value === true).toLowerCase()} for ${org}${was}`;
}

/** "2 on, 1 off" for a flag's overrides, or null when it has none. */
export function describeOverrides(flag: Pick<AdminFeatureFlag, "overrides_on" | "overrides_off">): string | null {
  const parts: string[] = [];
  if (flag.overrides_on) parts.push(`${flag.overrides_on} on`);
  if (flag.overrides_off) parts.push(`${flag.overrides_off} off`);
  if (!parts.length) return null;
  const n = flag.overrides_on + flag.overrides_off;
  return `${n} ${n === 1 ? "organisation" : "organisations"} overridden (${parts.join(", ")})`;
}

/**
 * Whether a change can be sent: a risky flag needs its key typed exactly;
 * any other flag only the confirm click.
 */
export function confirmationSatisfied(risky: boolean, key: string, typed: string): boolean {
  return !risky || typed.trim() === key;
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "5 minutes ago", "yesterday", for history rows. */
export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const seconds = Math.round((t - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "just now";
  if (abs < 3600) return RELATIVE.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return RELATIVE.format(Math.round(seconds / 3600), "hour");
  if (abs < 30 * 86_400) return RELATIVE.format(Math.round(seconds / 86_400), "day");
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function absoluteTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
