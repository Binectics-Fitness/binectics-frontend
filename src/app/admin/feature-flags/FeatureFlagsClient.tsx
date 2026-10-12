"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { AsyncSpinner, DSCard, EmptySlate, FilterPill, PageHeader, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { featureFlagKeys, featureFlagsService, type AdminFeatureFlag } from "@/lib/api/featureFlags";
import {
  absoluteTime,
  describeOverrides,
  matchesFilter,
  relativeTime,
  type FlagFilter,
} from "@/lib/featureFlags/helpers";
import { ConfirmFlagChange, flagWriteError } from "./ConfirmFlagChange";

/**
 * Admin: runtime feature flags (GET/PATCH /admin/feature-flags).
 *
 * Each flag is on or off for everyone, and an organisation can be set
 * differently on the flag's own page. No percentage rollouts (owner ruling,
 * Oct 2026), and nothing here changes what a plan includes.
 */
export default function FeatureFlagsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery<AdminFeatureFlag[]>({
    queryKey: featureFlagKeys.adminList(),
    queryFn: async () => {
      const res = await featureFlagsService.adminList();
      if (!res.success || !res.data) throw new Error(res.message || "We couldn't load feature flags.");
      return res.data;
    },
  });
  const [filter, setFilter] = useState<FlagFilter>("all");
  const [toggling, setToggling] = useState<AdminFeatureFlag | null>(null);

  const all = useMemo(() => data ?? [], [data]);
  const rows = useMemo(() => all.filter((f) => matchesFilter(f, filter)), [all, filter]);
  const count = (f: FlagFilter) => all.filter((x) => matchesFilter(x, f)).length;

  const onToggle = async (flag: AdminFeatureFlag, reason: string): Promise<string | null> => {
    const res = await featureFlagsService.setGlobal(flag.key, !flag.enabled, reason);
    if (!res.success || !res.data) return flagWriteError(res, "We couldn't change this flag. Try again.");
    const next = res.data.flag;
    queryClient.setQueryData<AdminFeatureFlag[]>(featureFlagKeys.adminList(), (prev) =>
      (prev ?? []).map((f) => (f.key === next.key ? next : f)),
    );
    void queryClient.invalidateQueries({ queryKey: featureFlagKeys.adminDetail(next.key) });
    void queryClient.invalidateQueries({ queryKey: featureFlagKeys.adminHistory(next.key) });
    setToggling(null);
    toast.success(`${next.key} is ${next.enabled ? "on" : "off"} everywhere.`);
    return null;
  };

  return (
    <>
      <AdminDashboardShell activeItem="Feature flags" crumb="Feature flags">
        <PageHeader
          className="mb-0!"
          title="Feature flags"
          subtitle={
            <span className="block max-w-[70ch]">
              Switch a feature on or off for everyone, or for one organisation. An organisation&apos;s own setting
              beats the global one. Changes apply within 15 seconds and every change is kept in the flag&apos;s
              history. Plans are unaffected: a flag can switch a feature off, never sell it.
            </span>
          }
        />

        <div className="flex flex-wrap items-center gap-2 mt-4" role="group" aria-label="Filter flags">
          <FilterPill label="All" count={all.length} active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterPill label="On" count={count("on")} active={filter === "on"} onClick={() => setFilter("on")} />
          <FilterPill label="Off" count={count("off")} active={filter === "off"} onClick={() => setFilter("off")} />
          <FilterPill
            label="With overrides"
            count={count("overrides")}
            active={filter === "overrides"}
            onClick={() => setFilter("overrides")}
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-(--r-3) p-4 mt-4 text-[13px] flex items-center justify-between gap-3"
            style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            <span>{(error as Error).message}</span>
            <button type="button" className="btn-ghost-v2 sm" onClick={() => void refetch()}>
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <AsyncSpinner />
        ) : rows.length === 0 ? (
          <EmptySlate
            message={all.length === 0 ? "No feature flags yet" : "No flags match"}
            hint={all.length === 0 ? "Flags are added in the API's flag registry." : "Choose All to see every flag."}
          />
        ) : (
          <ul className="flex flex-col gap-3 mt-4" aria-label="Feature flags">
            {rows.map((flag) => (
              <li key={flag.key}>
                <FlagCard flag={flag} onToggle={() => setToggling(flag)} />
              </li>
            ))}
          </ul>
        )}
      </AdminDashboardShell>
      {toggling && (
        <ConfirmFlagChange
          flagKey={toggling.key}
          risky={toggling.risky}
          title={`Turn ${toggling.key} ${toggling.enabled ? "off" : "on"} everywhere?`}
          consequence={
            toggling.enabled
              ? `Every organisation without its own setting loses this feature within 15 seconds.${
                  toggling.overrides_on ? ` ${toggling.overrides_on} with an override stay on.` : ""
                }`
              : `Every organisation without its own setting gets this feature within 15 seconds.${
                  toggling.overrides_off ? ` ${toggling.overrides_off} with an override stay off.` : ""
                }`
          }
          confirmLabel={toggling.enabled ? "Turn off everywhere" : "Turn on everywhere"}
          danger={toggling.enabled}
          onCancel={() => setToggling(null)}
          onConfirm={(reason) => onToggle(toggling, reason)}
        />
      )}
    </>
  );
}

function FlagCard({ flag, onToggle }: { flag: AdminFeatureFlag; onToggle: () => void }) {
  const overrides = describeOverrides(flag);
  return (
    <DSCard className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/feature-flags/${encodeURIComponent(flag.key)}`}
              className="font-mono text-[14px] break-all hover:underline"
              style={{ color: "var(--ink)" }}
            >
              {flag.key}
            </Link>
            <StatusPill tone={flag.enabled ? "success" : "neutral"} label={flag.enabled ? "On" : "Off"} />
            {flag.risky && <StatusPill tone="warn" dot={false} label="Risky" />}
          </div>
          <p className="text-[13.5px] leading-relaxed max-w-[80ch]" style={{ color: "var(--fg-2)" }}>
            {flag.description}
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
            {flag.is_default ? (
              <>Never changed: the default ({flag.default ? "on" : "off"}) applies</>
            ) : (
              <>
                Last changed{" "}
                <time dateTime={flag.updated_at ?? undefined} title={absoluteTime(flag.updated_at)}>
                  {relativeTime(flag.updated_at)}
                </time>
                {flag.updated_by ? ` by ${flag.updated_by.name}` : ""}
              </>
            )}
            {overrides ? ` · ${overrides}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/admin/feature-flags/${encodeURIComponent(flag.key)}`} className="btn-ghost-v2 sm">
            Overrides &amp; history
          </Link>
          <button
            type="button"
            className="btn-ghost-v2 sm"
            style={flag.enabled ? { color: "var(--danger)", borderColor: "var(--danger)" } : undefined}
            onClick={onToggle}
            aria-label={`Turn ${flag.key} ${flag.enabled ? "off" : "on"} everywhere`}
          >
            {flag.enabled ? "Turn off" : "Turn on"}
          </button>
        </div>
      </div>
    </DSCard>
  );
}
