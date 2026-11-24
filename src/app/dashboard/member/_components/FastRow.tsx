"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DSCard } from "@/components/ds/DSCard";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { IconTile } from "@/components/ds/IconTile";
import { useNowMs } from "@/hooks/useNowMs";
import type { FastSession } from "@/lib/api/fasting";
import { SOLO_HREFS } from "@/lib/solo/nav";
import {
  HOUR_MS,
  durationText,
  elapsedMs,
  fastProgress,
  formatHours,
  remainingMs,
  timeOfDay,
  toMs,
} from "@/lib/solo/fastingRules";
import { LOG_CATEGORY, LOG_ICON } from "@/lib/ui/categories";
import { categoryTone } from "@/lib/ui/tones";
import { FAST_GOAL_REACHED, fastEnds, fastEyebrow, fastToGo } from "@/lib/today/todayCopy";

/**
 * R6: a running fast that lost the dark card to the program. A light row
 * right under the program hero: the fast's length, time to go, when it ends
 * and a thin bar that pictures the same sentence. Opens the fasting page,
 * where it is ended. The clock ticks; nothing animates on open.
 */
export function FastRow({ fast }: { fast: FastSession }) {
  const nowMs = useNowMs(toMs(fast.started_at));
  const startMs = toMs(fast.started_at);
  const elapsed = nowMs === null ? 0 : elapsedMs(startMs, nowMs);
  const left = remainingMs(elapsed, fast.target_hours);
  const progress = fastProgress(elapsed, fast.target_hours);
  const endAt = startMs + fast.target_hours * HOUR_MS;
  const sentence = left > 0 ? fastToGo(durationText(left)) : FAST_GOAL_REACHED;
  return (
    <div data-testid="today-fast-row">
      <DSCard>
        <Link
          href={SOLO_HREFS.fasting}
          className="flex min-h-11 flex-col gap-3 px-4 py-3.5 hover:bg-[var(--bg-2)] focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={`Your fast. ${nowMs === null ? "" : `${sentence}. `}${fastEnds(timeOfDay(endAt))}`}
        >
          <span className="flex items-center gap-3">
            <IconTile icon={LOG_ICON.fast} tone={categoryTone(LOG_CATEGORY.fast)} />
            <span className="min-w-0 flex-1">
              <Eyebrow as="span" className="block">
                {fastEyebrow(`${formatHours(fast.target_hours)} hours`)}
              </Eyebrow>
              <span className="block text-[16px] font-medium" style={{ color: "var(--ink)" }}>
                {nowMs === null ? " " : sentence}
              </span>
            </span>
            <span className="shrink-0 text-[13px]" style={{ color: "var(--fg-3)" }}>
              {fastEnds(timeOfDay(endAt))}
            </span>
            <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--fg-3)" }} />
          </span>
          <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-3)" }}>
            <i className="block h-full" style={{ width: `${Math.round(progress * 100)}%`, background: "var(--ink)" }} />
          </span>
        </Link>
      </DSCard>
    </div>
  );
}
