"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { AsyncSpinner, DSCard, DSStatCard, EmptySlate, Eyebrow, ListRow, PageHeader } from "@/components/ds";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, WeightLog } from "@/lib/api/progress";
import { useClientNow } from "@/lib/ui/useClientNow";
import { recentWeights, signedKg, weightChange30d } from "../_lib/logStats";
import { LOG_LIMIT, logDate } from "../_lib/logFormat";
import { LogDetailDrawer } from "../_components/LogDetailDrawer";

export default function WeightLogPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  // null until the list has loaded: a failed load must not read as "no logs".
  const queryClient = useQueryClient();
  const [loadedLogs, setLoadedLogs] = useState<WeightLog[] | null>(null);
  const logs = useMemo(() => loadedLogs ?? [], [loadedLogs]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logWeight, setLogWeight] = useState("");
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const onLogToday = async () => {
    if (!profile || logSaving) return;
    const weight = Number(logWeight);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
      setLogError("Enter a weight in kg (e.g. 73.4).");
      return;
    }
    setLogSaving(true);
    setLogError(null);
    const res = await progressService.createWeightLog(profile._id, {
      weight_kg: weight,
      recorded_at: new Date().toISOString(),
    });
    setLogSaving(false);
    if (res.success && res.data) {
      // The create response carries logged_by as a raw id; the list
      // endpoint populates it. Stamp the name locally — the logger is
      // the signed-in user by definition.
      const stamped = {
        ...(res.data as WeightLog),
        logged_by:
          user && typeof (res.data as WeightLog).logged_by === "string"
            ? { _id: (res.data as WeightLog).logged_by as string, first_name: user.first_name ?? "", last_name: user.last_name ?? "" }
            : (res.data as WeightLog).logged_by,
      } as WeightLog;
      // Prepend only to a list that loaded; after a failed load the error stays.
      setLoadedLogs((prev) => (prev ? [stamped, ...prev] : prev));
      // Health metrics caches weight under this prefix; don't leave it stale.
      void queryClient.invalidateQueries({ queryKey: ["progress", "weightLogs"] });
      setLogWeight("");
      setLogOpen(false);
    } else {
      setLogError(res.message || "Could not save the log. Please try again.");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer an existing profile (e.g. trainer-created); otherwise
        // get-or-create the SELF profile so first-time members can track
        // without anyone having to add them as a client first.
        const profileRes = await progressService.getMyOwnProfiles();
        if (!profileRes.success) {
          throw new Error(profileRes.message || "Couldn't load your weight log. Please try again.");
        }
        let myProfile =
          profileRes.data?.length
            ? profileRes.data[0]
            : null;
        if (!myProfile) {
          const created = await progressService.getOrCreateMyProfile();
          if (created.success && created.data) myProfile = created.data;
        }
        if (!myProfile) {
          setError("Could not set up your progress profile. Please try again.");
          setLoading(false);
          return;
        }
        setProfile(myProfile);

        // apiClient reports failures as success:false rather than throwing.
        const logsRes = await progressService.getWeightLogs(myProfile._id, LOG_LIMIT);
        if (!logsRes.success) {
          throw new Error(logsRes.message || "Couldn't load your weight log. Please try again.");
        }
        setLoadedLogs(logsRes.data ?? []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load weight log");
        setLoadedLogs(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // "Logged by" only carries information when a PROVIDER logged an entry
  // for the member (trainers/dietitians can). When every entry is the
  // member's own, the column is pure noise — hide it.
  const loggerId = (log: WeightLog) =>
    typeof log.logged_by === "string" ? log.logged_by : log.logged_by._id;
  const hasProviderLogs = logs.some(
    (log) => user && loggerId(log) !== user.id,
  );

  const loggedByName = (log: WeightLog) =>
    user && loggerId(log) === user.id
      ? "You"
      : typeof log.logged_by === "string"
        ? null
        : `${log.logged_by.first_name} ${log.logged_by.last_name}`;

  const latestLog = logs.length > 0 ? logs[0] : null;
  // The 30-day change needs the viewer's clock (null until mount).
  const now = useClientNow();
  const change = useMemo(() => (now ? weightChange30d(logs, now) : null), [logs, now]);
  const spark = useMemo(() => recentWeights(logs, 12), [logs]);
  const chartLogs = useMemo(() => logs.slice(0, 12).reverse(), [logs]);
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = logs.find((l) => l._id === openId) ?? null;
  // On a failed load only the error shows, never "-" tiles or "no logs".
  const showData = !loading && loadedLogs !== null;

  const logAction = (
    <div>
      {logOpen ? (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <input
              type="number"
              step="0.1"
              min="1"
              inputMode="decimal"
              placeholder="kg"
              aria-label="Weight in kg"
              value={logWeight}
              autoFocus
              onChange={(e) => setLogWeight(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void onLogToday(); }}
              style={{ width: 110, padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-2)", fontSize: 13, background: "var(--bg)", color: "var(--ink)" }}
            />
            {logError && (
              <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4, maxWidth: 220 }}>{logError}</div>
            )}
          </div>
          <button
            onClick={() => void onLogToday()}
            disabled={logSaving || !logWeight}
            style={{ background: "var(--ink)", color: "var(--bg)", padding: "8px 14px", borderRadius: 6, border: 0, fontSize: 13, fontWeight: 500, cursor: logSaving ? "wait" : "pointer", opacity: logSaving || !logWeight ? 0.6 : 1 }}
          >
            {logSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => { setLogOpen(false); setLogError(null); }}
            disabled={logSaving}
            style={{ background: "var(--bg)", color: "var(--fg-2)", padding: "8px 14px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setLogOpen(true)}
          disabled={!profile || loading}
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "8px 14px",
            borderRadius: 6,
            border: 0,
            fontSize: 13,
            fontWeight: 500,
            cursor: !profile || loading ? "not-allowed" : "pointer",
            opacity: !profile || loading ? 0.5 : 1,
          }}
        >
          + Log today
        </button>
      )}
    </div>
  );

  return (
    <MemberDashboardShell activeLabel="Activity">
      <PageHeader
        title={{ before: "Weight ", emphasis: "log" }}
        subtitle="Your weigh-ins, and any your coach records for you."
        actions={logAction}
      />

      {error && (
        <div
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            borderRadius: 10,
            padding: 14,
            color: "var(--danger)",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Stat pair. The change is neutral in tone: down is not "good" for
          everyone. Only drawn from two or more logs inside the window. */}
      {loading && (
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 mb-3.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-[92px] rounded-[var(--r-3)]" style={{ background: "var(--bg-2)" }} />
          ))}
        </div>
      )}
      {showData && (
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <DSStatCard
            size="sm"
            label="Current"
            value={latestLog ? latestLog.weight_kg.toFixed(1) : "-"}
            unit={latestLog ? "kg" : undefined}
            delta={latestLog ? logDate(latestLog.recorded_at, now) : "No logs yet"}
            spark={spark.length >= 2 ? spark : undefined}
            sparkVariant="line"
            sparkLabel={`Weight, last ${spark.length} logs`}
          />
          <DSStatCard
            size="sm"
            label="Change · 30d"
            value={change ? signedKg(change.kg) : "-"}
            unit={change ? "kg" : undefined}
            deltaTone="neutral"
            delta={change ? `since ${logDate(change.since, now)}` : now ? "Needs two logs in 30 days" : undefined}
          />
        </div>
      )}

      {showData && chartLogs.length >= 2 && (
        <DSCard className="p-4.5 mb-3.5">
          <Eyebrow className="mb-3">Last {chartLogs.length} logs</Eyebrow>
          {(() => {
            const weights = chartLogs.map((l) => l.weight_kg);
            const minW = Math.min(...weights);
            const maxW = Math.max(...weights);
            const range = maxW - minW || 1;
            const points = chartLogs
              .map((log, i) => `${40 + (i / (chartLogs.length - 1)) * 720} ${150 - ((log.weight_kg - minW) / range) * 120}`)
              .join(" L ");
            return (
              <svg
                viewBox="0 0 800 200"
                role="img"
                aria-label={`Weight from ${minW.toFixed(1)} to ${maxW.toFixed(1)} kg over the last ${chartLogs.length} logs`}
                style={{ width: "100%", height: 200 }}
              >
                <path d={`M ${points}`} fill="none" style={{ stroke: "var(--ink)" }} strokeWidth="2" strokeLinejoin="round" />
                <g fontFamily="ui-monospace, monospace" fontSize="10" style={{ fill: "var(--fg-3)" }}>
                  <text x="40" y="190">{logDate(chartLogs[0].recorded_at, now)}</text>
                  <text x="760" y="190" textAnchor="end">
                    {logDate(chartLogs[chartLogs.length - 1].recorded_at, now)}
                  </text>
                  <text x="20" y="34" textAnchor="end">
                    {maxW.toFixed(1)}
                  </text>
                  <text x="20" y="154" textAnchor="end">
                    {minW.toFixed(1)}
                  </text>
                </g>
              </svg>
            );
          })()}
        </DSCard>
      )}

      {(loading || showData) && (
        <section aria-labelledby="recent-weights">
          <Eyebrow id="recent-weights" as="h2" className="mb-2.5 px-1">
            Recent
          </Eyebrow>
          {loading ? (
            <AsyncSpinner label="Loading logs" />
          ) : logs.length === 0 ? (
            <EmptySlate message="No weight logs yet." mt="mt-0" />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {logs.map((log) => {
                const by = loggedByName(log);
                return (
                  <li key={log._id}>
                    <ListRow
                      title={`${log.weight_kg.toFixed(1)} kg`}
                      meta={[
                        logDate(log.recorded_at, now),
                        hasProviderLogs && by && by !== "You" ? `by ${by}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      onClick={() => setOpenId(log._id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <LogDetailDrawer
        open={opened !== null}
        onClose={() => setOpenId(null)}
        title={opened ? `${opened.weight_kg.toFixed(1)} kg` : "Weight log"}
        fields={
          opened
            ? [
                { label: "Date", value: logDate(opened.recorded_at, now) },
                { label: "Weight", value: `${opened.weight_kg.toFixed(1)} kg` },
                { label: "Note", value: opened.note },
                { label: "Logged by", value: hasProviderLogs ? loggedByName(opened) : null },
              ]
            : []
        }
      />
    </MemberDashboardShell>
  );
}
