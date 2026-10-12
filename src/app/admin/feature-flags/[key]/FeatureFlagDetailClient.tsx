"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import {
  AsyncSpinner,
  DSCard,
  DSCardHead,
  DSTable,
  DSTableHead,
  DSTableRow,
  DSTableTd,
  DSTableTh,
  EmptySlate,
  Eyebrow,
  PageHeader,
  StatusPill,
} from "@/components/ds";
import { toast } from "@/components/Toast";
import {
  featureFlagKeys,
  featureFlagsService,
  type AdminFeatureFlagChange,
  type AdminFeatureFlagDetail,
  type AdminFeatureFlagOverride,
  type FeatureFlagOrg,
} from "@/lib/api/featureFlags";
import { absoluteTime, describeChange, orgLabel, relativeTime } from "@/lib/featureFlags/helpers";
import { ConfirmFlagChange, flagInputClass, flagInputStyle, flagWriteError } from "../ConfirmFlagChange";

type Pending =
  | { kind: "global" }
  | { kind: "set"; org: FeatureFlagOrg; enabled: boolean }
  | { kind: "remove"; override: AdminFeatureFlagOverride };

/** Admin: one flag, its per-organisation overrides and its history. */
export default function FeatureFlagDetailClient() {
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(String(params?.key ?? ""));
  const queryClient = useQueryClient();
  const detail = useQuery<AdminFeatureFlagDetail>({
    queryKey: featureFlagKeys.adminDetail(key),
    enabled: !!key,
    queryFn: async () => {
      const res = await featureFlagsService.adminGet(key);
      if (!res.success || !res.data) {
        throw new Error(res.status === 404 ? "There is no flag with this key." : res.message || "We couldn't load this flag.");
      }
      return res.data;
    },
  });
  const history = useQuery<AdminFeatureFlagChange[]>({
    queryKey: featureFlagKeys.adminHistory(key),
    enabled: !!key,
    queryFn: async () => {
      const res = await featureFlagsService.adminHistory(key);
      if (!res.success || !res.data) throw new Error(res.message || "We couldn't load the history.");
      return res.data;
    },
  });
  const [pending, setPending] = useState<Pending | null>(null);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.adminDetail(key) }),
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.adminHistory(key) }),
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.adminList() }),
    ]);

  const flag = detail.data;

  const run = async (reason: string): Promise<string | null> => {
    if (!flag || !pending) return null;
    let failure: string | null = null;
    let done = "";
    if (pending.kind === "global") {
      const res = await featureFlagsService.setGlobal(flag.key, !flag.enabled, reason);
      if (!res.success) failure = flagWriteError(res, "We couldn't change this flag.");
      done = `${flag.key} is ${!flag.enabled ? "on" : "off"} everywhere.`;
    } else if (pending.kind === "set") {
      const res = await featureFlagsService.setOverride(flag.key, pending.org.id, pending.enabled, reason);
      if (!res.success) failure = flagWriteError(res, "We couldn't save this override.");
      done = `${orgLabel(pending.org)} set to ${pending.enabled ? "on" : "off"}.`;
    } else {
      const res = await featureFlagsService.removeOverride(flag.key, pending.override.organization.id, reason);
      if (!res.success) failure = flagWriteError(res, "We couldn't remove this override.");
      done = `${orgLabel(pending.override.organization)} follows the global value again.`;
    }
    if (failure) return failure;
    setPending(null);
    toast.success(done);
    await refresh();
    return null;
  };

  return (
    <>
      <AdminDashboardShell activeItem="Feature flags" crumb={key || "Flag"}>
        <Link href="/admin/feature-flags" className="text-[13px] hover:underline" style={{ color: "var(--fg-3)" }}>
          ← All flags
        </Link>
        {detail.error ? (
          <div
            role="alert"
            className="rounded-(--r-3) p-4 mt-4 text-[13px]"
            style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            {(detail.error as Error).message}
          </div>
        ) : detail.isLoading || !flag ? (
          <AsyncSpinner />
        ) : (
          <>
            <PageHeader
              className="mb-0! mt-2"
              eyebrow="Feature flag"
              title={flag.key}
              subtitle={<span className="block max-w-[75ch]">{flag.description}</span>}
            />

            <DSCard className="mt-4 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex flex-col gap-1.5">
                  <Eyebrow>Everywhere else</Eyebrow>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={flag.enabled ? "success" : "neutral"} label={flag.enabled ? "On" : "Off"} />
                    {flag.risky && <StatusPill tone="warn" dot={false} label="Risky" />}
                    <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                      {flag.is_default
                        ? `Never changed: the default (${flag.default ? "on" : "off"}) applies`
                        : `Changed ${relativeTime(flag.updated_at)}${flag.updated_by ? ` by ${flag.updated_by.name}` : ""}`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost-v2 sm self-start sm:self-auto"
                  style={flag.enabled ? { color: "var(--danger)", borderColor: "var(--danger)" } : undefined}
                  onClick={() => setPending({ kind: "global" })}
                >
                  {flag.enabled ? "Turn off everywhere" : "Turn on everywhere"}
                </button>
              </div>
            </DSCard>

            {/* relative: see the History card. */}
            <DSCard className="mt-4 relative">
              <DSCardHead
                title="Organisation overrides"
                subtitle="An organisation set here ignores the global value until you remove its override."
              />
              <div className="px-4 sm:px-5 py-4">
                <AddOverride
                  existing={flag.overrides.map((o) => o.organization.id)}
                  onPick={(org, enabled) => setPending({ kind: "set", org, enabled })}
                />
              </div>
              {flag.overrides.length === 0 ? (
                <EmptySlate message="No overrides" hint="Every organisation follows the global value." />
              ) : (
                <DSTable minWidth={720}>
                  <DSTableHead>
                    <DSTableTh>Organisation</DSTableTh>
                    <DSTableTh>Value</DSTableTh>
                    <DSTableTh>Reason</DSTableTh>
                    <DSTableTh>Set</DSTableTh>
                    <DSTableTh align="right">
                      <span className="sr-only">Actions</span>
                    </DSTableTh>
                  </DSTableHead>
                  <tbody>
                    {flag.overrides.map((o, i) => (
                      <DSTableRow key={o.organization.id} last={i === flag.overrides.length - 1}>
                        <DSTableTd>
                          <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>
                            {orgLabel(o.organization)}
                          </div>
                          <div className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
                            {o.organization.id}
                          </div>
                        </DSTableTd>
                        <DSTableTd>
                          <StatusPill tone={o.enabled ? "success" : "neutral"} label={o.enabled ? "On" : "Off"} />
                        </DSTableTd>
                        <DSTableTd>
                          <span className="text-[13px]" style={{ color: o.reason ? "var(--fg-2)" : "var(--fg-4)" }}>
                            {o.reason ?? "None given"}
                          </span>
                        </DSTableTd>
                        <DSTableTd>
                          <time
                            className="text-[12.5px]"
                            dateTime={o.updated_at ?? undefined}
                            title={absoluteTime(o.updated_at)}
                            style={{ color: "var(--fg-2)" }}
                          >
                            {relativeTime(o.updated_at)}
                          </time>
                          {o.updated_by && (
                            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                              by {o.updated_by.name}
                            </div>
                          )}
                        </DSTableTd>
                        <DSTableTd align="right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn-ghost-v2 sm"
                              onClick={() => setPending({ kind: "set", org: o.organization, enabled: !o.enabled })}
                              aria-label={`Set ${orgLabel(o.organization)} ${o.enabled ? "off" : "on"}`}
                            >
                              Set {o.enabled ? "off" : "on"}
                            </button>
                            <button
                              type="button"
                              className="btn-ghost-v2 sm"
                              onClick={() => setPending({ kind: "remove", override: o })}
                              aria-label={`Remove the override for ${orgLabel(o.organization)}`}
                            >
                              Remove
                            </button>
                          </div>
                        </DSTableTd>
                      </DSTableRow>
                    ))}
                  </tbody>
                </DSTable>
              )}
            </DSCard>

            {/* relative: an absolutely placed sr-only label inside a scrolling table would otherwise widen the page on phones. */}
            <DSCard className="mt-4 relative">
              <DSCardHead title="History" subtitle="Every change to this flag, newest first." />
              {history.error ? (
                <p role="alert" className="px-5 py-4 text-[13px]" style={{ color: "var(--danger)" }}>
                  {(history.error as Error).message}
                </p>
              ) : history.isLoading ? (
                <AsyncSpinner />
              ) : (history.data ?? []).length === 0 ? (
                <EmptySlate message="No changes yet" hint="Changes appear here with who made them and why." />
              ) : (
                <DSTable minWidth={640}>
                  <caption className="sr-only">Changes to {flag.key}</caption>
                  <DSTableHead>
                    <DSTableTh>When</DSTableTh>
                    <DSTableTh>Change</DSTableTh>
                    <DSTableTh>By</DSTableTh>
                    <DSTableTh>Reason</DSTableTh>
                  </DSTableHead>
                  <tbody>
                    {(history.data ?? []).map((h, i, arr) => (
                      <DSTableRow key={h.id} last={i === arr.length - 1}>
                        <DSTableTd>
                          <time
                            className="text-[12.5px] whitespace-nowrap"
                            dateTime={h.created_at ?? undefined}
                            title={absoluteTime(h.created_at)}
                            style={{ color: "var(--fg-2)" }}
                          >
                            {absoluteTime(h.created_at)}
                          </time>
                        </DSTableTd>
                        <DSTableTd>
                          <span className="text-[13px]" style={{ color: "var(--ink)" }}>
                            {describeChange(h)}
                          </span>
                        </DSTableTd>
                        <DSTableTd>
                          <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                            {h.actor?.name ?? "Unknown admin"}
                          </span>
                        </DSTableTd>
                        <DSTableTd>
                          <span className="text-[13px]" style={{ color: h.reason ? "var(--fg-2)" : "var(--fg-4)" }}>
                            {h.reason ?? "None given"}
                          </span>
                        </DSTableTd>
                      </DSTableRow>
                    ))}
                  </tbody>
                </DSTable>
              )}
            </DSCard>
          </>
        )}
      </AdminDashboardShell>
      {flag && pending && (
        <ConfirmFlagChange
          flagKey={flag.key}
          risky={flag.risky}
          {...confirmCopy(flag, pending)}
          onCancel={() => setPending(null)}
          onConfirm={run}
        />
      )}
    </>
  );
}

function confirmCopy(flag: AdminFeatureFlagDetail, pending: Pending) {
  if (pending.kind === "global") {
    return {
      title: `Turn ${flag.key} ${flag.enabled ? "off" : "on"} everywhere?`,
      consequence: `Every organisation without an override ${flag.enabled ? "loses" : "gets"} this feature within 15 seconds. The ${flag.overrides.length} with an override keep their own setting.`,
      confirmLabel: flag.enabled ? "Turn off everywhere" : "Turn on everywhere",
      danger: flag.enabled,
    };
  }
  if (pending.kind === "set") {
    return {
      title: `Set ${flag.key} ${pending.enabled ? "on" : "off"} for ${orgLabel(pending.org)}?`,
      consequence: `${orgLabel(pending.org)} ${pending.enabled ? "gets" : "loses"} this feature within 15 seconds, whatever the global value is, until the override is removed.`,
      confirmLabel: pending.enabled ? "Set on" : "Set off",
      danger: !pending.enabled,
    };
  }
  const org = orgLabel(pending.override.organization);
  const next = flag.enabled;
  return {
    title: `Remove the override for ${org}?`,
    consequence: `${org} follows the global value again, which is ${next ? "on" : "off"}${
      next === pending.override.enabled ? ", so nothing changes for it now" : `, so it ${next ? "gets" : "loses"} this feature`
    }.`,
    confirmLabel: "Remove override",
    danger: !next && pending.override.enabled,
  };
}

/** Find an organisation by name or id and pick the value to set for it. */
function AddOverride({
  existing,
  onPick,
}: {
  existing: string[];
  onPick: (org: FeatureFlagOrg, enabled: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<FeatureFlagOrg | null>(null);
  const [value, setValue] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 250);
    return () => clearTimeout(t);
  }, [text]);

  const results = useQuery<FeatureFlagOrg[]>({
    queryKey: featureFlagKeys.orgSearch(q),
    enabled: q.length >= 2 && !picked,
    queryFn: async () => {
      const res = await featureFlagsService.searchOrganizations(q);
      if (!res.success || !res.data) throw new Error(res.message || "Search failed");
      return res.data;
    },
  });

  return (
    <div className="flex flex-col gap-2.5">
      <Eyebrow as="span">Add or change an override</Eyebrow>
      {picked ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <span
            className="inline-flex items-center gap-2 rounded-(--r-2) px-3 h-9 text-[13.5px]"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink)" }}
          >
            {orgLabel(picked)}
            <button
              type="button"
              className="text-[12px] hover:underline"
              style={{ color: "var(--fg-3)" }}
              onClick={() => setPicked(null)}
              aria-label="Choose a different organisation"
            >
              Change
            </button>
          </span>
          <div role="radiogroup" aria-label="Value for this organisation" className="flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={value === v}
                className="btn-ghost-v2 sm"
                style={value === v ? { background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" } : undefined}
                onClick={() => setValue(v)}
              >
                {v ? "On" : "Off"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary-v2 sm"
            onClick={() => {
              onPick(picked, value);
              setPicked(null);
              setText("");
              setValue(true);
            }}
          >
            {existing.includes(picked.id) ? "Change override…" : "Add override…"}
          </button>
        </div>
      ) : (
        <div className="relative max-w-md">
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search organisations by name or id"
            aria-label="Search organisations"
            className={flagInputClass}
            style={flagInputStyle}
          />
          {q.length >= 2 && (
            <div
              className="mt-1.5 rounded-(--r-2) overflow-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              {results.isLoading ? (
                <p className="px-3 py-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
                  Searching…
                </p>
              ) : results.error ? (
                <p role="alert" className="px-3 py-2 text-[13px]" style={{ color: "var(--danger)" }}>
                  {(results.error as Error).message}
                </p>
              ) : (results.data ?? []).length === 0 ? (
                <p className="px-3 py-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
                  No organisation matches.
                </p>
              ) : (
                <ul aria-label="Matching organisations">
                  {(results.data ?? []).map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-[13.5px] hover:bg-(--bg-2)"
                        style={{ color: "var(--ink)" }}
                        onClick={() => setPicked(o)}
                      >
                        {orgLabel(o)}
                        <span className="font-mono text-[11.5px] ml-2" style={{ color: "var(--fg-3)" }}>
                          {o.account_type ? `${o.account_type.replace(/_/g, " ")} · ` : ""}
                          {o.id.slice(-6)}
                        </span>
                        {existing.includes(o.id) && (
                          <span className="text-[11.5px] ml-2" style={{ color: "var(--fg-3)" }}>
                            (has an override)
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
