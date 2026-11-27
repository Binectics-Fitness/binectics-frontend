"use client";

import Link from "next/link";
import { AlertTriangle, Scale } from "lucide-react";
import { DSCard, Eyebrow, IconTile } from "@/components/ds";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import type { ClientSessionSummary } from "@/lib/api/coachSessions";
import {
  bestLine,
  coachFirstName,
  coachFullName,
  dayLabel,
  noteCell,
  painLine,
  sessionLength,
  setsLine,
} from "@/lib/coachSessions/format";

const ink = { color: "var(--ink)" } as const;
const sub = { color: "var(--fg-2)" } as const;

/** Initials for the coach's avatar. */
function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

/**
 * What the client sees after a coached session, in one column (board
 * coach-session-canvas 07, frame C2, as the mobile "Your session" screen):
 * who and when, the coach's note, what was done with the sets, the pain
 * flags and weight the coach noted, and "Book next" when the coach suggested
 * a slot. It is built from the client read only, which has no private note
 * and no readiness, so neither can be drawn here.
 */
export function ClientSessionSummaryView({
  log,
  typeName,
  bookNextHref,
}: {
  log: ClientSessionSummary;
  /** The booked session type's name, when it could be read. */
  typeName?: string | null;
  /** Where "Book next" goes; null hides the button (no open listing to book). */
  bookNextHref: string | null;
}) {
  const { prefs, fmtTime } = useOrgFormat();
  const coach = coachFullName(log);
  const first = coachFirstName(log);
  const meta = [dayLabel(log.started_at, prefs.timeZone), fmtTime(log.started_at), typeName, sessionLength(log)].filter(Boolean).join(" · ");
  const exercises = [...log.exercises].sort((a, b) => a.order - b.order);
  const next = log.suggested_next?.starts_at && Date.parse(log.suggested_next.starts_at) > 0 ? log.suggested_next : null;

  return (
    <div className="flex flex-col gap-3.5" data-testid="client-session-summary">
      <div className="flex items-center gap-3">
        <IconTile tone="trainer" size="md" initials={initialsOf(coach)} />
        <div className="min-w-0">
          <h2 className="text-[17px] font-medium" style={{ letterSpacing: "-0.02em", ...ink }}>{coach}</h2>
          <p className="text-[13px]" style={sub}>{meta}</p>
        </div>
      </div>

      {log.shared_note?.trim() && (
        <DSCard className="px-4 py-3.5">
          <Eyebrow>{first ? `From ${first}` : "Note"}</Eyebrow>
          <p className="mt-1.5 text-[14.5px] leading-relaxed whitespace-pre-line" style={ink}>{log.shared_note.trim()}</p>
        </DSCard>
      )}

      {exercises.length > 0 && (
        <section aria-labelledby="what-you-did">
          <Eyebrow id="what-you-did">What you did</Eyebrow>
          <DSCard className="mt-2 px-4">
            <ul>
              {exercises.map((e, i) => {
                const best = bestLine(e);
                const note = noteCell(e);
                return (
                  <li key={`${e.key}-${i}`} className="flex flex-col gap-0.5 py-3" style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
                    <span className="text-[14.5px] font-medium" style={ink}>{e.name}</span>
                    {e.skipped ? (
                      <span className="text-[13px]" style={sub}>Skipped</span>
                    ) : (
                      setsLine(e.sets) && <span className="text-[13px]" style={{ ...sub, fontVariantNumeric: "tabular-nums" }}>{setsLine(e.sets)}</span>
                    )}
                    {best && <span className="text-[13px]" style={ink}>{best}</span>}
                    {note && <span className="text-[13px]" style={sub}>{note}</span>}
                  </li>
                );
              })}
            </ul>
          </DSCard>
        </section>
      )}

      {log.pain_flags.map((f, i) => (
        <DSCard key={`pain-${i}`} className="flex items-center gap-3 px-4 py-3">
          <IconTile icon={AlertTriangle} tone="danger" />
          <span className="text-[13.5px]" style={sub}>{painLine(f, log.exercises)}</span>
        </DSCard>
      ))}

      {log.weigh_in && (
        <DSCard className="flex items-center gap-3 px-4 py-3">
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: "var(--measure-soft)", color: "var(--measure-ink)" }}
          >
            <Scale size={18} strokeWidth={1.75} />
          </span>
          <span className="text-[13.5px]" style={sub}>{`Weight ${log.weigh_in.weight_kg} kg`}</span>
        </DSCard>
      )}

      {next && (
        <DSCard className="px-4 py-3.5">
          <Eyebrow>Next session</Eyebrow>
          <div className="mt-1.5 text-[20px] font-medium" style={{ letterSpacing: "-0.02em", ...ink }}>
            {`${dayLabel(next.starts_at!, prefs.timeZone)} · ${fmtTime(next.starts_at)}`}
          </div>
          {typeName && <div className="text-[13px]" style={sub}>{typeName}</div>}
          {bookNextHref && (
            <Link href={bookNextHref} className="btn-primary-v2 mt-3 w-full justify-center" style={{ height: 44 }}>
              Book next
            </Link>
          )}
        </DSCard>
      )}
    </div>
  );
}
