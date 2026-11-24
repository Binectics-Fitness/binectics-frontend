"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { WATER_MAX_GLASSES } from "@/lib/api/water";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import { useChecklistToday, useLatestWeight, useWaterCounter } from "@/lib/queries/solo";
import { usePrivacyPreferences } from "@/lib/queries/privacy";
import { SOLO_HREFS } from "@/lib/solo/nav";
import type { TodayProvider } from "@/lib/today/oneToday";
import {
  ADD,
  ADD_GLASS,
  CELL,
  LOG,
  NONE,
  OPEN,
  OWN_TRACKING,
  START,
  WEIGHT_NOT_YET,
  listCount,
  privacyLine,
  whatTheySee,
  type Audience,
} from "@/lib/today/todayCopy";
import { ChecklistCard } from "./solo/ChecklistCard";
import { FastTodayCard } from "./solo/FastTodayCard";
import { WaterCard } from "./solo/WaterCard";
import { WeightCard } from "./solo/WeightCard";
import { WriteError } from "./solo/parts";
import { WhatTheySeeDrawer } from "./WhatTheySeeDrawer";

const WEIGHT_LOG = "/dashboard/member/weight-log";

/**
 * "Your own tracking" on the coached Today (today-canvas C1, R3, R5, R7, R8;
 * mobile components/today/OwnTracking): the member's own fast, water, weight
 * and daily list, the same tools a solo member has, under one line that says
 * who can't see them, with "What <coach> sees" one click away.
 *
 *  - full: no plan yet. The solo cards, as the solo Today draws them.
 *  - compact: a plan exists. One two-column card: a label, one number and
 *    one action per cell; an odd last cell spans the row.
 *
 * A running fast is never in here: it is the dark card, or the light row
 * under the program hero (R6), higher up.
 */
export function OwnTracking({
  mode,
  audience,
  providers,
  fastRunning,
  hideWeight = false,
  linkedToday = { fast: false, water: false },
  linked = false,
  healthTask = false,
}: {
  mode: "full" | "compact";
  audience: Audience;
  providers: readonly TodayProvider[];
  fastRunning: boolean;
  /** Today's plan already asks for a weight (R5). */
  hideWeight?: boolean;
  /** A coach's fasting or water task is on today's plan: that cell leaves the compact card (L1). */
  linkedToday?: { fast: boolean; water: boolean };
  /** The plan has a fasting or water task from a coach (L1 privacy line, L3 drawer line). */
  linked?: boolean;
  /** The plan has a task a health app completes. */
  healthTask?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasCoach = providers.some((p) => p.kind !== "gym");
  // A coach reads the weight on the member's own card while "Share progress
  // with providers" is on (the API default). Unknown (not read, or failed)
  // counts as on: never claim privacy the member may not have.
  const privacy = usePrivacyPreferences();
  const shareProgress = privacy.data?.shareProgressWithProviders ?? true;
  const coachLinked = hasCoach && linked;

  return (
    <section aria-labelledby="own-tracking-h" data-testid={`own-tracking-${mode}`} className="flex flex-col gap-3.5">
      <div>
        <h2 id="own-tracking-h" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
          {OWN_TRACKING}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px]" style={{ color: "var(--fg-2)" }} data-testid="own-tracking-privacy">
          <Lock size={12} aria-hidden="true" style={{ color: "var(--fg-3)" }} />
          <span>{privacyLine(audience, { weight: hasCoach && shareProgress, linked: coachLinked })}</span>
          {audience.kind !== "none" && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              // The text is small; the target is not (44px tall, padded into the line).
              className="-my-3 inline-flex min-h-11 items-center underline underline-offset-2"
              style={{ color: "var(--ink)", textDecorationColor: "var(--fg-3)" }}
              aria-haspopup="dialog"
              data-testid="own-tracking-what-they-see"
            >
              {whatTheySee(audience)}
            </button>
          )}
        </p>
      </div>

      {mode === "full" ? (
        <>
          {!fastRunning && <FastTodayCard fast={null} justEnded={null} onEnded={() => undefined} />}
          <div className={`grid grid-cols-1 gap-3.5 ${hideWeight ? "" : "md:grid-cols-2"}`}>
            <WaterCard variant="compact" />
            {!hideWeight && <WeightCard />}
          </div>
          <ChecklistCard />
        </>
      ) : (
        <CompactCard
          showFast={!fastRunning && !linkedToday.fast}
          showWater={!linkedToday.water}
          showWeight={!hideWeight}
        />
      )}

      {audience.kind !== "none" && (
        <WhatTheySeeDrawer
          open={open}
          onClose={() => setOpen(false)}
          audience={audience}
          providers={providers}
          facts={{ linked: coachLinked, healthTask: hasCoach && healthTask, shareProgress }}
        />
      )}
    </section>
  );
}

interface Cell {
  key: "fast" | "water" | "weight" | "list";
  label: string;
  value: string;
  /** Where the cell's text goes. */
  href: string;
  action?: { label: string; aria: string } & ({ href: string } | { onClick: () => void });
}

/** R5: one card, two columns, a label, one number and one action per cell. */
function CompactCard({ showFast, showWater, showWeight }: { showFast: boolean; showWater: boolean; showWeight: boolean }) {
  const water = useWaterCounter(showWater);
  const weight = useLatestWeight(showWeight);
  const list = useChecklistToday(true);
  const online = useOnline();
  const [offlineNote, setOfflineNote] = useState(false);

  const cells: Cell[] = [];
  if (showFast) {
    cells.push({
      key: "fast",
      label: CELL.fast,
      value: NONE,
      href: SOLO_HREFS.fasting,
      action: { label: START, aria: "Start a fast", href: SOLO_HREFS.fasting },
    });
  }
  const w = water.query.data;
  if (showWater && w) {
    cells.push({
      key: "water",
      label: CELL.water,
      value: w.target_glasses ? `${w.glasses} of ${w.target_glasses}` : String(w.glasses),
      href: SOLO_HREFS.water,
      action:
        w.glasses < WATER_MAX_GLASSES
          ? {
              label: ADD_GLASS,
              aria: "Add one glass",
              onClick: () => {
                if (!online) {
                  setOfflineNote(true);
                  return;
                }
                setOfflineNote(false);
                water.tap(1);
              },
            }
          : undefined,
    });
  }
  // Left out until the read answers: never "Not yet" for a weight we did not read.
  if (showWeight && weight.isSuccess) {
    cells.push({
      key: "weight",
      label: CELL.weight,
      value: weight.data ? `${weight.data.weight_kg} kg` : WEIGHT_NOT_YET,
      href: WEIGHT_LOG,
      action: { label: LOG, aria: "Log weight", href: WEIGHT_LOG },
    });
  }
  const items = list.data?.items;
  if (items) {
    const total = items.length;
    const done = items.filter((i) => i.done).length;
    cells.push({
      key: "list",
      label: CELL.list,
      value: total === 0 ? NONE : listCount(done, total),
      href: SOLO_HREFS.todayList,
      action: {
        label: total === 0 ? ADD : OPEN,
        aria: total === 0 ? "Add to your daily list" : "Open your daily list",
        href: SOLO_HREFS.todayList,
      },
    });
  }
  if (cells.length === 0) return null;

  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));

  return (
    <div className="flex flex-col gap-2">
      <div
        data-testid="own-tracking-grid"
        className="overflow-hidden rounded-(--r-3)"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {rows.map((r, ri) => (
          <div
            key={r[0].key}
            className="grid grid-cols-2"
            style={{ borderTop: ri > 0 ? "1px solid var(--border)" : undefined }}
          >
            {r.map((c, ci) => (
              <CellBody key={c.key} cell={c} divided={ci > 0} spans={r.length === 1} />
            ))}
          </div>
        ))}
      </div>
      {offlineNote && !online && <WriteError message={OFFLINE_WRITE_MESSAGE} onDismiss={() => setOfflineNote(false)} />}
      {water.failed && (
        <WriteError
          message={`We could not save that glass. ${water.failedMessage ?? ""}`.trim()}
          onRetry={water.retry}
          onDismiss={water.dismiss}
        />
      )}
    </div>
  );
}

const PILL =
  "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-4 text-[14px] font-medium hover:bg-[var(--bg-2)] focus-visible:outline-2 focus-visible:outline-offset-2";
const PILL_STYLE = { border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" };

function CellBody({ cell, divided, spans }: { cell: Cell; divided: boolean; spans: boolean }) {
  const a = cell.action;
  return (
    <div
      data-testid={`own-cell-${cell.key}`}
      className={`flex items-end gap-2 p-4 ${spans ? "col-span-2" : ""} ${divided ? "border-l" : ""}`}
      style={{ borderColor: "var(--border)" }}
    >
      <Link
        href={cell.href}
        className="flex min-w-0 flex-1 flex-col gap-1 rounded-(--r-2) focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`${cell.label}, ${cell.value}`}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          {cell.label}
        </span>
        <span className="text-[18px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
          {cell.value}
        </span>
      </Link>
      {a &&
        ("href" in a ? (
          <Link href={a.href} className={PILL} style={PILL_STYLE} aria-label={a.aria} data-testid={`own-cell-${cell.key}-action`}>
            {a.label}
          </Link>
        ) : (
          <button type="button" onClick={a.onClick} className={PILL} style={PILL_STYLE} aria-label={a.aria} data-testid={`own-cell-${cell.key}-action`}>
            {a.label}
          </button>
        ))}
    </div>
  );
}
