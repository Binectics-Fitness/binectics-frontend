"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DSCard, FilterPill, StatusPill } from "@/components/ds";
import { AsyncSpinner } from "@/components/ds/AsyncStates";
import {
  programsService,
  type ClientProgramSummary,
  type ProgramResultItem,
  type ProgramResultProgram,
} from "@/lib/api/programs";
import { TRAINER_PROGRAMS_CONFIG } from "@/components/programs/config";
import { RESULTS_COPY as C, RESULT_PILLS, RESULT_RANGES, type ResultRange } from "./copy";
import { dayLabel, programSubtitle, resultMeta, resultPill, resultValue } from "./format";

/**
 * The coach results page section (board: binectics-plans/design/coach-results,
 * frames D1-D5, M1-M4): each of my programs for this client, day by day,
 * newest first. Fasting and water tasks show the day's state and one number
 * and nothing else (owner ruling, 19 Nov 2026); the API sends no more.
 */
export default function ProgramResultsSection({
  clientProfileId,
  clientFirstName,
  summaries,
  programsPath = TRAINER_PROGRAMS_CONFIG.basePath,
}: {
  clientProfileId: string;
  clientFirstName: string;
  /** The overview's programs, for each card's "Day N of M" line. */
  summaries: ClientProgramSummary[];
  /** The role's programs list; each card opens `${programsPath}/instances/:id`. */
  programsPath?: string;
}) {
  const [range, setRange] = useState<ResultRange>(7);
  const [programs, setPrograms] = useState<ProgramResultProgram[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    programsService
      .getClientResults(clientProfileId, range)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) setPrograms(res.data.programs ?? []);
        else setFailed(true);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [clientProfileId, range, attempt]);

  // Back to loading, then the effect fetches again.
  const reload = useCallback((next: ResultRange | null) => {
    setPrograms(null);
    setFailed(false);
    if (next === null) setAttempt((n) => n + 1);
    else setRange(next);
  }, []);
  const empty = programs !== null && programs.length === 0;

  return (
    <section aria-labelledby="results-heading">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 id="results-heading" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
          {C.heading}
        </h2>
        {!empty && (
          <div className="flex gap-1.5" role="group" aria-label={C.heading}>
            {RESULT_RANGES.map((r) => (
              <FilterPill key={r} label={C.range(r)} active={range === r} onClick={() => r !== range && reload(r)} />
            ))}
          </div>
        )}
      </div>

      {failed ? (
        <div
          role="alert"
          className="rounded-(--r-3) px-4.5 py-3.5 text-[13.5px] flex items-center justify-between gap-3"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger-ink)" }}
        >
          <span>{C.error}</span>
          <button type="button" className="btn-ghost-v2 sm" style={{ background: "var(--bg)" }} onClick={() => reload(null)}>
            {C.retry}
          </button>
        </div>
      ) : programs === null ? (
        <DSCard className="px-4.5">
          <AsyncSpinner label={C.loading} />
        </DSCard>
      ) : empty ? (
        <DSCard>
          <div className="px-4.5 py-5 text-[13px]" style={{ color: "var(--fg-3)" }}>
            <div className="text-[13.5px] font-medium mb-0.5" style={{ color: "var(--ink)" }}>{C.emptyTitle}</div>
            {C.emptyBody(clientFirstName)}
          </div>
        </DSCard>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} summary={summaries.find((s) => s.id === p.id)} range={range} programsPath={programsPath} />
            ))}
          </div>
          <p className="text-[12px] mt-2.5 leading-normal" style={{ color: "var(--fg-3)" }}>{C.privacy}</p>
        </>
      )}
    </section>
  );
}

function ProgramCard({
  program,
  summary,
  range,
  programsPath,
}: {
  program: ProgramResultProgram;
  summary: ClientProgramSummary | undefined;
  range: number;
  programsPath: string;
}) {
  const subtitle = programSubtitle(summary);
  return (
    <DSCard>
      <div
        className="flex items-start md:items-center justify-between gap-3 px-3.5 py-3 md:px-4.5 md:py-3.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{program.name}</h3>
          {subtitle && <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{subtitle}</div>}
        </div>
        <Link
          href={`${programsPath}/instances/${program.id}`}
          className="text-[12.5px] whitespace-nowrap hover:underline"
          style={{ color: "var(--fg-2)" }}
        >
          {C.openProgram} →
        </Link>
      </div>
      {program.days.length === 0 ? (
        <div className="px-4.5 py-5 text-[13px]" style={{ color: "var(--fg-3)" }}>{C.noneInRange(range)}</div>
      ) : (
        program.days.map((d, i) => (
          <DayRow key={d.day} day={d.day} items={d.items} isToday={d.day === program.today} first={i === 0} />
        ))
      )}
    </DSCard>
  );
}

function DayRow({ day, items, isToday, first }: { day: string; items: ProgramResultItem[]; isToday: boolean; first: boolean }) {
  const { weekday, date } = dayLabel(day);
  const done = items.filter((i) => i.status === "done").length;
  const count = C.dayCount(done, items.length);
  const eyebrow = "font-mono text-[10.5px] uppercase tracking-[0.04em]";
  const eyebrowStyle = { color: isToday ? "var(--signal-ink)" : "var(--fg-3)", fontWeight: isToday ? 500 : 400 };
  return (
    <div
      className="flex flex-col gap-1.5 px-3.5 py-3 md:grid md:grid-cols-[88px_1fr] md:gap-4 md:px-4.5 md:py-3.5"
      style={{ borderTop: first ? "none" : "1px solid var(--border)" }}
    >
      {/* Desktop: a date block. Phone: one header line. */}
      <div className="hidden md:block">
        <div className={eyebrow} style={eyebrowStyle}>{isToday ? C.today : weekday}</div>
        <div className="text-[22px] font-medium mt-0.5" style={{ letterSpacing: "-0.022em", lineHeight: 1.1, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
          {date}
        </div>
        <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>{count}</div>
      </div>
      <div className="flex md:hidden items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          {isToday && <span className={eyebrow} style={eyebrowStyle}>{C.today}</span>}
          <span className="text-[15px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            {weekday} {date}
          </span>
        </div>
        <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{count}</span>
      </div>
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <TaskRow key={item.id} item={item} first={i === 0} />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({ item, first }: { item: ProgramResultItem; first: boolean }) {
  const pill = RESULT_PILLS[resultPill(item)];
  const value = resultValue(item);
  return (
    <li
      className={`flex items-start md:items-center justify-between gap-3 ${first ? "pt-0.5 pb-2" : "py-2"}`}
      style={{ borderTop: first ? "none" : "1px solid var(--border)" }}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{item.title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{resultMeta(item)}</div>
      </div>
      <div className="flex flex-col items-end gap-1 md:flex-row md:items-center md:gap-2.5 shrink-0">
        {value && (
          <span className="font-mono text-[13px]" style={{ color: value.soft ? "var(--fg-3)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {value.text}
          </span>
        )}
        <StatusPill label={pill.label} tone={pill.tone} />
      </div>
    </li>
  );
}
