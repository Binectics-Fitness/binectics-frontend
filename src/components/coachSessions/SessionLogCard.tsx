"use client";

import { Lock } from "lucide-react";
import { DSCard, Eyebrow, StatusPill } from "@/components/ds";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import type { CoachSessionLog } from "@/lib/api/coachSessions";
import {
  ENERGY_LABEL,
  dayLabel,
  noteCell,
  painShort,
  rpeCell,
  sessionLength,
  setsCell,
} from "@/lib/coachSessions/format";

const ink = { color: "var(--ink)" } as const;
const muted = { color: "var(--fg-3)" } as const;
const COLS = "md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]";

/**
 * One session log, read-only, for the trainer it belongs to (board
 * coach-session-canvas 09, WEB1): the table of what was done, the note the
 * client got, the PRIVATE note with a lock, and readiness, pain and weight.
 * The private note and readiness only exist on the provider read, so this
 * card must never be fed a client summary.
 */
export function SessionLogCard({
  log,
  firstName,
  typeName,
}: {
  log: CoachSessionLog;
  firstName: string;
  /** The booked session type, when the log came from a booking. */
  typeName?: string | null;
}) {
  const { prefs, fmtTime } = useOrgFormat();
  const length = sessionLength(log);
  const when = [dayLabel(log.started_at, prefs.timeZone), fmtTime(log.started_at), typeName, length].filter(Boolean).join(" · ");
  const exercises = [...log.exercises].sort((a, b) => a.order - b.order);
  const ready = [
    log.readiness?.energy ? ENERGY_LABEL[log.readiness.energy] : null,
    ...log.pain_flags.map((f) => painShort(f, log.exercises)),
    log.weigh_in ? `${log.weigh_in.weight_kg} kg` : null,
  ].filter(Boolean);

  return (
    <section aria-label="Session log" data-testid="session-log-card">
    <DSCard className="px-4.5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Session log</Eyebrow>
          <h3 className="mt-1 text-[17px] font-medium" style={{ letterSpacing: "-0.02em", ...ink }}>{when}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {log.status === "completed" && <StatusPill tone="success" label="Completed" dot={false} />}
          {log.status === "in_progress" && <StatusPill tone="warn" label="In progress" dot={false} />}
          <StatusPill tone="neutral" label="Logged on phone" dot={false} />
        </div>
      </div>

      <div role="table" aria-label="Exercises" className="mt-3.5">
        <div role="row" className={`hidden md:grid ${COLS} gap-x-4 px-1 pb-2`}>
          {["Exercise", "Sets (kg × reps)", "RPE", "Note"].map((h) => (
            <span key={h} role="columnheader" className="font-mono text-[10.5px] uppercase tracking-[0.05em]" style={muted}>{h}</span>
          ))}
        </div>
        {exercises.length === 0 && (
          <div className="py-3 text-[13px]" style={{ ...muted, borderTop: "1px solid var(--border)" }}>No exercises were logged.</div>
        )}
        {exercises.map((e, i) => (
          <div
            key={`${e.key}-${i}`}
            role="row"
            className={`grid grid-cols-1 ${COLS} gap-x-4 gap-y-0.5 px-1 py-2.5 text-[13.5px]`}
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span role="cell" className="font-medium" style={ink}>{e.name}</span>
            <span role="cell" style={{ ...ink, fontVariantNumeric: "tabular-nums" }}>{e.skipped ? "Skipped" : setsCell(e.sets) || "–"}</span>
            <span role="cell" style={{ color: "var(--fg-2)" }}>{e.skipped ? "" : rpeCell(e.sets)}</span>
            <span role="cell" style={{ color: "var(--fg-2)" }}>{noteCell(e)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-4 pt-3.5 md:grid-cols-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div>
          <Eyebrow>{`Note to ${firstName}`}</Eyebrow>
          <p className="mt-1 text-[13.5px] leading-relaxed whitespace-pre-line" style={ink}>{log.shared_note?.trim() || "No note was sent."}</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5">
            <Lock size={11} strokeWidth={1.75} aria-hidden="true" style={muted} />
            <Eyebrow>Private note</Eyebrow>
          </span>
          <p className="mt-1 text-[13.5px] leading-relaxed whitespace-pre-line" style={ink}>{log.private_note?.trim() || "None."}</p>
          <span className="sr-only">Only you can see this note.</span>
        </div>
        <div>
          <Eyebrow>Readiness · pain · weight</Eyebrow>
          <p className="mt-1 text-[13.5px] leading-relaxed" style={ink}>{ready.length ? ready.join(" · ") : "Nothing recorded."}</p>
        </div>
      </div>
    </DSCard>
    </section>
  );
}
