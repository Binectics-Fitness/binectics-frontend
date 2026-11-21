"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DSCard, Eyebrow } from "@/components/ds";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import { useWaterCounter } from "@/lib/queries/solo";
import { aimPosition, glassMlLine, railFill, waterSentence } from "@/lib/solo/waterModel";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { CardSkeleton, Rail, WriteError } from "./parts";
import styles from "./solo.module.css";

/** Water for today: + 1 glass and Undo, optimistic, rolled back when a write fails. */
export function WaterCard({ variant }: { variant: "compact" | "full" }) {
  const { query, tap, retry, dismiss, failed, failedMessage } = useWaterCounter(true);
  const online = useOnline();
  const [offlineNote, setOfflineNote] = useState(false);
  const water = query.data;

  // The number bumps when it changes (not on first paint); reduced motion turns it off.
  const prev = useRef<number | null>(null);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (!water) return;
    if (prev.current !== null && prev.current !== water.glasses) setBump((b) => b + 1);
    prev.current = water.glasses;
  }, [water]);

  if (query.isLoading) return <CardSkeleton height={variant === "full" ? 260 : 150} />;
  if (query.isError && !water) {
    return (
      <DSCard className="p-5.5">
        <Eyebrow>Water</Eyebrow>
        <p className="mt-2 text-[14px]" style={{ color: "var(--fg-2)" }}>
          We could not load your water. Check your connection and try again.
        </p>
        <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void query.refetch()}>
          Try again
        </button>
      </DSCard>
    );
  }
  if (!water) return null;

  const onTap = (delta: 1 | -1) => {
    if (!online) {
      setOfflineNote(true);
      return;
    }
    setOfflineNote(false);
    tap(delta);
  };

  const buttons = (
    <div className="mt-2 flex flex-wrap gap-2.5">
      <button type="button" className="btn-primary-v2" style={{ height: 44, padding: "0 18px", fontSize: 14 }} onClick={() => onTap(1)}>
        + 1 glass
      </button>
      <button
        type="button"
        className="btn-ghost-v2"
        style={{ height: 44, padding: "0 18px", fontSize: 14 }}
        disabled={water.glasses === 0}
        onClick={() => onTap(-1)}
      >
        Undo
      </button>
    </div>
  );

  const notes = (
    <>
      {offlineNote && !online && <WriteError message={OFFLINE_WRITE_MESSAGE} onDismiss={() => setOfflineNote(false)} />}
      {failed && (
        <WriteError
          message={`We could not save that ${failed.delta === 1 ? "glass" : "change"}. Your count is still ${water.glasses}. ${failedMessage ?? ""}`.trim()}
          onRetry={retry}
          onDismiss={dismiss}
        />
      )}
    </>
  );

  if (variant === "compact") {
    return (
      <DSCard className="p-5.5">
        <div className="flex items-center justify-between">
          <Eyebrow>Water</Eyebrow>
          <Link href={SOLO_HREFS.water} className={styles.link}>
            Open
          </Link>
        </div>
        <p aria-live="polite" className="mt-1 flex items-baseline gap-2" style={{ color: "var(--ink)" }}>
          <span key={bump} className={`${styles.count} ${bump ? styles.bump : ""}`} style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.1 }}>
            {water.target_glasses ? `${water.glasses} of ${water.target_glasses}` : water.glasses}
          </span>
          <span style={{ fontSize: 14, color: "var(--fg-3)" }}>{water.glasses === 1 && !water.target_glasses ? "glass" : "glasses"}</span>
        </p>
        {buttons}
        <div className="mt-3 flex flex-col gap-2">{notes}</div>
      </DSCard>
    );
  }

  return (
    <DSCard className="p-6">
      <Eyebrow>Water · today</Eyebrow>
      <p aria-live="polite" className="mt-2" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}>
        {waterSentence(water.glasses, water.target_glasses)}
      </p>
      {water.target_glasses !== null && (
        <div className="mt-3.5">
          <Rail
            fill={railFill(water.glasses, water.target_glasses)}
            aimAt={aimPosition(water.glasses, water.target_glasses)}
            label={`${water.glasses} of ${water.target_glasses} glasses`}
          />
          <div className="mt-2 flex justify-between">
            <Eyebrow tone="muted">0</Eyebrow>
            <Eyebrow>Your aim: {water.target_glasses} glasses</Eyebrow>
          </div>
        </div>
      )}
      <div className="mt-3">{buttons}</div>
      <p className="mt-3 text-[13px]" style={{ color: "var(--fg-3)" }}>
        {glassMlLine(water.glass_ml)} Adding a glass twice by mistake? Undo takes one off.
      </p>
      <div className="mt-3 flex flex-col gap-2">{notes}</div>
    </DSCard>
  );
}
