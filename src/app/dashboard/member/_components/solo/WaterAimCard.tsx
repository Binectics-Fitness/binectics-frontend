"use client";

import { useState } from "react";
import { DSCard, Eyebrow } from "@/components/ds";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import { useUpdateWaterSettings, useWaterSettings } from "@/lib/queries/solo";
import { WATER_TARGET_MAX } from "@/lib/api/water";
import { CardSkeleton, WriteError } from "./parts";

const DEFAULT_AIM = 8;

/** The aim is optional and the member's own: set, nudge or remove. No recommended amount. */
export function WaterAimCard() {
  const settings = useWaterSettings(true);
  const update = useUpdateWaterSettings();
  const online = useOnline();
  const [error, setError] = useState<string | null>(null);

  if (settings.isLoading) return <CardSkeleton height={150} />;
  const aim = settings.data?.target_glasses ?? null;

  const save = (target: number | null) => {
    if (!online) {
      setError(OFFLINE_WRITE_MESSAGE);
      return;
    }
    setError(null);
    update.mutate({ target_glasses: target }, { onError: (e) => setError(e.message || "We could not save your aim.") });
  };
  const busy = update.isPending;

  return (
    <DSCard className="p-5.5">
      <Eyebrow>Your aim, optional</Eyebrow>
      {settings.isError && !settings.data ? (
        <p className="mt-3 text-[13px]" style={{ color: "var(--fg-2)" }}>
          We could not load your aim.{" "}
          <button type="button" className="underline" onClick={() => void settings.refetch()}>
            Try again
          </button>
        </p>
      ) : aim !== null ? (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn-ghost-v2" style={{ height: 44, minWidth: 44 }} aria-label="One glass fewer" disabled={busy || aim <= 1} onClick={() => save(aim - 1)}>
            −
          </button>
          <span aria-live="polite" style={{ minWidth: 56, textAlign: "center", fontSize: 26, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
            {aim}
          </span>
          <button type="button" className="btn-ghost-v2" style={{ height: 44, minWidth: 44 }} aria-label="One glass more" disabled={busy || aim >= WATER_TARGET_MAX} onClick={() => save(aim + 1)}>
            +
          </button>
          <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            glasses a day
          </span>
          <button type="button" className="underline text-[13px]" style={{ minHeight: 44, color: "var(--fg-2)" }} disabled={busy} onClick={() => save(null)}>
            Remove my aim
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-[14px]" style={{ color: "var(--fg-2)" }}>
            No aim set. The counter just counts.
          </span>
          <button type="button" className="btn-ghost-v2" style={{ height: 44 }} disabled={busy} onClick={() => save(DEFAULT_AIM)}>
            Set an aim
          </button>
        </div>
      )}
      {error && (
        <div className="mt-3">
          <WriteError message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <p className="mt-3 text-[13px]" style={{ color: "var(--fg-3)" }}>
        There is no recommended amount here. The aim is yours to set or remove.
      </p>
    </DSCard>
  );
}
