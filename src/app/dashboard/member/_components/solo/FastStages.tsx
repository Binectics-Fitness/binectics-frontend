"use client";

import Link from "next/link";
import { DSCard, PageHeader } from "@/components/ds";
import { useNowMs } from "@/hooks/useNowMs";
import { useSoloFlags } from "@/hooks/useSoloFlags";
import { useCurrentFast } from "@/lib/queries/fasting";
import { FASTING_STAGES, STAGES_FOOTER, STAGES_INTRO, notPartOfGoal } from "@/lib/solo/fastingCopy";
import { elapsedMs, stageIndexAt, timeOfDay, toMs } from "@/lib/solo/fastingRules";
import { SOLO_HREFS } from "@/lib/solo/nav";

/**
 * What bodies typically do during a fast (design 06). General information
 * from the one copy file; "you are here" shows only while a fast runs, and
 * the last stage says when it is past the member's own length.
 */
export function FastStages() {
  const flags = useSoloFlags();
  const current = useCurrentFast(flags.fasting);
  const fast = current.data && current.data.status === "running" ? current.data : null;
  const nowMs = useNowMs(fast ? toMs(fast.started_at) : null);
  const here = fast && nowMs !== null ? stageIndexAt(elapsedMs(fast.started_at, nowMs)) : -1;

  return (
    <>
      <PageHeader eyebrow="Fasting" title="Stages" subtitle={STAGES_INTRO} actions={<Link href={SOLO_HREFS.fasting} className="btn-ghost-v2" style={{ height: 44 }}>Back to your fast</Link>} />
      <ol className="flex max-w-[760px] flex-col gap-3" aria-label="Fasting stages">
        {FASTING_STAGES.map((s, i) => {
          const isHere = i === here;
          const pastGoal = !!fast && s.fromHours >= fast.target_hours;
          return (
            <li key={s.id} style={{ listStyle: "none" }}>
              <DSCard className="p-5" style={isHere ? { borderColor: "var(--ink)" } : undefined}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    {s.range}
                    {isHere && fast ? ` · you are here` : ""}
                  </span>
                  {isHere && nowMs !== null && fast && (
                    <span className="font-mono text-[12px]" style={{ color: "var(--fg-2)" }}>
                      {timeOfDay(nowMs)}
                    </span>
                  )}
                  {fast && here >= 0 && i > here && (
                    <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>
                      from {timeOfDay(toMs(fast.started_at) + s.fromHours * 3_600_000)}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-[17px] font-medium" style={{ color: "var(--ink)" }} aria-current={isHere ? "step" : undefined}>
                  {s.title}
                </h2>
                <p className="mt-1 text-[14px]" style={{ color: "var(--fg-2)" }}>
                  {s.body}
                </p>
                {isHere && s.notice && (
                  <p className="mt-2 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                    {s.notice}
                  </p>
                )}
                {pastGoal && fast && (
                  <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
                    {notPartOfGoal(fast.target_hours)}
                  </p>
                )}
              </DSCard>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 max-w-[760px] text-[13px]" style={{ color: "var(--fg-3)" }}>
        {STAGES_FOOTER}
      </p>
    </>
  );
}
