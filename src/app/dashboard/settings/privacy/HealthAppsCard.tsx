"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DSCard } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { healthDataService, type HealthConnectionState, type HealthSharing } from "@/lib/api/healthData";
import { formatDate } from "@/utils/format";

/** The privacy policy's section on connected health apps. */
export const HEALTH_PRIVACY_HREF = "/privacy#health-data";

const SHARING_LABELS: Record<keyof HealthSharing, string> = {
  steps: "Steps",
  workouts: "Workouts",
  sleep: "Sleep",
  heart_rate: "Resting heart rate",
  weight: "Weight",
};

/** "Steps, Workouts", or null when nothing reaches a provider. */
export function sharedWithProviders(state: Pick<HealthConnectionState, "health_sharing" | "share_progress_with_providers">): string | null {
  // The account-wide switch off means no type is shared, whatever each says.
  if (!state.share_progress_with_providers) return null;
  const on = (Object.keys(SHARING_LABELS) as (keyof HealthSharing)[]).filter((k) => state.health_sharing?.[k] === true);
  return on.length ? on.map((k) => SHARING_LABELS[k]).join(", ") : null;
}

function deviceLabel(d: { manufacturer: string | null; model: string | null }): string {
  const maker = d.manufacturer ? d.manufacturer.charAt(0).toUpperCase() + d.manufacturer.slice(1) : "";
  return [maker, d.model].filter(Boolean).join(" ") || "your phone";
}

/**
 * Settings → Privacy: where the member's Health Connect data stands. It is
 * connected, changed and disconnected in the Android app, so this card only
 * says what is connected, what it is used for and who sees it, and links the
 * policy. Shown only to someone health import is offered to, or who has a
 * connection; everyone else sees nothing.
 */
export function HealthAppsCard() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const config = useQuery({
    queryKey: ["health-data", uid, "config"],
    enabled: !!uid,
    queryFn: async () => {
      const res = await healthDataService.getConfig();
      return res.success && res.data ? res.data : null;
    },
  });
  const connection = useQuery({
    queryKey: ["health-data", uid, "connection"],
    enabled: !!uid,
    queryFn: async () => {
      const res = await healthDataService.getConnection();
      return res.success && res.data ? res.data : null;
    },
  });

  const state = connection.data ?? null;
  const conn = state?.connection ?? null;
  const offered = config.data?.enabled === true;
  if (!offered && !conn) return null;

  const active = conn?.status === "active";
  const devices = active ? conn.devices : [];
  const syncs = devices
    .map((d) => d.last_sync_at)
    .filter((d): d is string => !!d)
    .sort();
  const lastSync = syncs[syncs.length - 1];
  const shared = state ? sharedWithProviders(state) : null;

  return (
    <DSCard className="p-4 sm:p-6">
      <h3 className="mb-1 text-[16px] font-medium text-ink">Connected health apps</h3>
      {active ? (
        <>
          <p className="mb-3 text-sm text-fg-2">
            Health Connect is connected
            {devices.length === 1 ? ` on ${deviceLabel(devices[0])}` : devices.length > 1 ? ` on ${devices.length} phones` : ""}.
            {lastSync ? ` Last synced ${formatDate(lastSync)}.` : ""}
          </p>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[max-content_1fr]">
            <dt className="text-fg-3">Program tasks</dt>
            <dd className="text-ink">{conn.use_for_tasks ? "Ticked from your health data" : "Not used"}</dd>
            <dt className="text-fg-3">Shared with your providers</dt>
            <dd className="text-ink">{shared ?? "Nothing"}</dd>
          </dl>
        </>
      ) : (
        <p className="mb-1 text-sm text-fg-2">
          Not connected. In the Binectics app on Android, Settings → Connected apps brings in your steps,
          workouts, sleep and weight from Health Connect.
        </p>
      )}
      <p className="mt-3 text-[12.5px] leading-normal text-fg-3">
        {active ? "Change what's read or shared, or disconnect, in the app. " : ""}
        <Link href={HEALTH_PRIVACY_HREF} className="underline underline-offset-2">
          How we use your health data
        </Link>
      </p>
    </DSCard>
  );
}
