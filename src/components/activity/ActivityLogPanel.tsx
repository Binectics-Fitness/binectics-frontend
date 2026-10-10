"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import SearchableSelect from "@/components/SearchableSelect";
import {
  AsyncSpinner,
  DSCard,
  DSPagination,
  DSTable,
  DSTableHead,
  DSTableRow,
  DSTableTd,
  DSTableTh,
  EmptySlate,
  Eyebrow,
  FilterPill,
  PageHeader,
  StatusPill,
} from "@/components/ds";
import { useOrganization } from "@/contexts/OrganizationContext";
import type { Organization } from "@/lib/api/teams";
import {
  OrgAuditCategory,
  orgAuditService,
  type OrgAuditFilterOptions,
  type OrgAuditPage,
} from "@/lib/api/orgAudit";
import { absoluteTime, describeActivity, relativeTime } from "@/lib/activity/describeActivity";

export const ACTIVITY_PAGE_SIZE = 25;

/** The store keeps 90 days, so "all" is the last 90 days. */
export enum ActivityRange {
  ALL = "all",
  DAY = "1",
  WEEK = "7",
  MONTH = "30",
}

const RANGES: Array<{ value: ActivityRange; label: string }> = [
  { value: ActivityRange.ALL, label: "Last 90 days" },
  { value: ActivityRange.MONTH, label: "Last 30 days" },
  { value: ActivityRange.WEEK, label: "Last 7 days" },
  { value: ActivityRange.DAY, label: "Last 24 hours" },
];

const CATEGORY_LABEL: Record<OrgAuditCategory, string> = {
  [OrgAuditCategory.TEAM]: "Team",
  [OrgAuditCategory.ROLES]: "Roles",
  [OrgAuditCategory.PAYMENTS]: "Payments",
  [OrgAuditCategory.LOYALTY]: "Loyalty",
};

/** The lower bound for a range, rounded to the minute so the query key is stable. */
function fromFor(range: ActivityRange, now: number): string | undefined {
  if (range === ActivityRange.ALL) return undefined;
  const ms = Number(range) * 24 * 3600 * 1000;
  return new Date(Math.floor((now - ms) / 60_000) * 60_000).toISOString();
}

interface ActivityLogPanelProps {
  organizationId: string;
}

/**
 * A workspace's activity log: who changed its team, roles, payment and
 * payout settings, newest first, filterable by type, person and period.
 * The caller decides whether to show it (Organization.can_view_audit_log);
 * the API refuses anyone else regardless.
 */
export function ActivityLogPanel({ organizationId }: ActivityLogPanelProps) {
  const ids = useId();
  const [event, setEvent] = useState("");
  const [actor, setActor] = useState("");
  const [range, setRange] = useState<ActivityRange>(ActivityRange.ALL);
  const [page, setPage] = useState(1);
  // Captured when the range changes, not on every render.
  const [rangeAnchor, setRangeAnchor] = useState(() => Date.now());
  const from = fromFor(range, rangeAnchor);

  const filters = useQuery<OrgAuditFilterOptions | null>({
    queryKey: ["orgAudit", organizationId, "filters"],
    queryFn: async () => {
      const res = await orgAuditService.filters(organizationId);
      return res.success && res.data ? res.data : null;
    },
  });

  const list = useQuery<OrgAuditPage>({
    queryKey: ["orgAudit", organizationId, "list", { event, actor, from, page }],
    queryFn: async () => {
      const res = await orgAuditService.list(organizationId, {
        page,
        limit: ACTIVITY_PAGE_SIZE,
        event: event || undefined,
        actor_id: actor || undefined,
        from,
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || "We couldn't load the activity log.");
      }
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const eventOptions = useMemo(
    () => [
      { label: "All activity", value: "" },
      ...(filters.data?.event_types ?? []).map((t) => ({ label: t.label, value: t.event })),
    ],
    [filters.data],
  );
  const actorOptions = useMemo(
    () => [
      { label: "Anyone", value: "" },
      ...(filters.data?.actors ?? []).map((a) => ({ label: a.name, value: a.user_id })),
    ],
    [filters.data],
  );

  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };
  const filtered = Boolean(event || actor || range !== ActivityRange.ALL);
  const data = list.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / ACTIVITY_PAGE_SIZE)) : 1;
  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
        <div className="flex flex-col gap-1.5 min-w-0 lg:w-60">
          <Eyebrow as="label" htmlFor={`${ids}-event`}>
            Type
          </Eyebrow>
          <SearchableSelect
            id={`${ids}-event`}
            value={event}
            onChange={(v) => reset(() => setEvent(v))}
            options={eventOptions}
            placeholder="All activity"
            loading={filters.isLoading}
          />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0 lg:w-60">
          <Eyebrow as="label" htmlFor={`${ids}-actor`}>
            Changed by
          </Eyebrow>
          <SearchableSelect
            id={`${ids}-actor`}
            value={actor}
            onChange={(v) => reset(() => setActor(v))}
            options={actorOptions}
            placeholder="Anyone"
            loading={filters.isLoading}
          />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <Eyebrow id={`${ids}-range`}>Period</Eyebrow>
          <div role="group" aria-labelledby={`${ids}-range`} className="flex gap-1.5 overflow-x-auto">
            {RANGES.map((r) => (
              <FilterPill
                key={r.value}
                label={r.label}
                active={range === r.value}
                onClick={() =>
                  reset(() => {
                    setRange(r.value);
                    setRangeAnchor(Date.now());
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>

      {list.isError ? (
        <div
          role="alert"
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          <div className="font-medium">Couldn&apos;t load the activity log</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {(list.error as Error)?.message || "Try again shortly."}
          </div>
          <button type="button" className="btn-ghost-v2 sm mt-3" onClick={() => void list.refetch()}>
            Try again
          </button>
        </div>
      ) : list.isLoading || !data ? (
        <AsyncSpinner label="Loading activity" />
      ) : data.items.length === 0 ? (
        <EmptySlate
          message={filtered ? "No activity matches these filters." : "No activity yet."}
          hint={
            filtered
              ? "Try a longer period or clear a filter."
              : "Changes to your team, roles, payment and payout settings appear here. Activity is kept for 90 days."
          }
        />
      ) : (
        <DSCard>
          <DSTable minWidth={640}>
            <caption className="sr-only">
              Workspace activity, newest first. Page {data.page} of {totalPages}.
            </caption>
            <DSTableHead>
              <DSTableTh className="w-44">When</DSTableTh>
              <DSTableTh>What happened</DSTableTh>
              <DSTableTh className="w-28">Type</DSTableTh>
            </DSTableHead>
            <tbody>
              {data.items.map((entry, i) => {
                const absolute = absoluteTime(entry.occurred_at);
                return (
                  <DSTableRow key={entry.id} last={i === data.items.length - 1}>
                    <DSTableTd className="align-top whitespace-nowrap">
                      <time dateTime={entry.occurred_at} title={absolute} className="block" style={{ color: "var(--ink)" }}>
                        {relativeTime(entry.occurred_at, now)}
                      </time>
                      <span className="block text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                        {absolute}
                      </span>
                    </DSTableTd>
                    <DSTableTd className="align-top">
                      <span className="block" style={{ color: "var(--ink)" }}>
                        {describeActivity(entry)}
                      </span>
                      <span className="block text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                        {entry.label}
                      </span>
                    </DSTableTd>
                    <DSTableTd className="align-top">
                      <StatusPill tone="neutral" dot={false} label={CATEGORY_LABEL[entry.category] ?? entry.category} />
                    </DSTableTd>
                  </DSTableRow>
                );
              })}
            </tbody>
          </DSTable>
          <nav aria-label="Activity pages">
            <DSPagination
              page={data.page}
              totalPages={totalPages}
              totalItems={data.total}
              pageSize={ACTIVITY_PAGE_SIZE}
              onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
            />
          </nav>
        </DSCard>
      )}
      <p className="sr-only" aria-live="polite">
        {data ? `${data.total} ${data.total === 1 ? "entry" : "entries"} found.` : ""}
      </p>
    </div>
  );
}

/** Shown in place of the log to people who may not read it. */
export function ActivityLogUnavailable() {
  return (
    <EmptySlate
      message="Only the workspace owner, and team members whose role includes the activity log, can see this."
      hint="Ask the owner if you need access."
    />
  );
}

interface WorkspaceActivityLogProps {
  /** Where "Back to settings" goes. */
  settingsHref: string;
  /**
   * Trainer and dietitian workspaces show their log to the owner only: a
   * gym's staff trainer works in the gym's workspace, whose log belongs on
   * the gym's settings.
   */
  ownerOnly?: boolean;
}

/** The body of an Activity log page, inside a dashboard shell. */
export function WorkspaceActivityLog({ settingsHref, ownerOnly = false }: WorkspaceActivityLogProps) {
  const { currentOrg, isLoading } = useOrganization();
  const allowed = canSeeActivityLog(currentOrg, ownerOnly);
  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href={settingsHref} className="text-[13px] self-start" style={{ color: "var(--fg-3)" }}>
          &larr; Back to settings
        </Link>
        <PageHeader
          className="mb-0!"
          title="Activity log"
          subtitle={
            <span className="block max-w-[64ch]">
              Who changed your team, roles, payment and payout settings, and when. Kept for 90 days.
            </span>
          }
        />
      </div>
      {isLoading && !currentOrg ? (
        <AsyncSpinner label="Loading workspace" />
      ) : currentOrg && allowed ? (
        <ActivityLogPanel key={currentOrg._id} organizationId={currentOrg._id} />
      ) : (
        <ActivityLogUnavailable />
      )}
    </>
  );
}

/** Whether to offer the Activity log for this workspace. */
export function canSeeActivityLog(
  org: Pick<Organization, "is_owner" | "can_view_audit_log"> | null | undefined,
  ownerOnly = false,
): boolean {
  if (!org) return false;
  if (ownerOnly) return org.is_owner === true;
  return org.is_owner === true || org.can_view_audit_log === true;
}

/**
 * Activity log: a pointer to the workspace's own log of who changed its
 * team, roles, payment and payout settings. Rendered only for people who
 * may read it (see canSeeActivityLog).
 */
export function ActivityLogSection({ href }: { href: string }) {
  return (
    <section id="activity">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Activity log</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
        See who changed roles, team members, payment accounts and payout settings, and when. Kept for 90 days.
      </p>
      <DSCard className="flex flex-col gap-3 p-5.5">
        <Link href={href} className="btn-ghost-v2 sm self-start" style={{ textDecoration: "none" }}>
          Open activity log →
        </Link>
      </DSCard>
    </section>
  );
}
