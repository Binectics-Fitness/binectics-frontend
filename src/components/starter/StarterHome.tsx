"use client";

import Link from "next/link";
import { AsyncSpinner, DSCard, Eyebrow, ListRow, PageHeader } from "@/components/ds";
import ExerciseIllustration, { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { useActiveStarter } from "@/lib/queries/starter";
import { STARTER_STOP_NOTE } from "@/lib/starter/copy";
import {
  exerciseCountLabel,
  exerciseDose,
  formatTaskDay,
  localToday,
  minutesLabel,
  starterTodayModel,
} from "@/lib/starter/model";
import type { StarterTask } from "@/lib/starter/types";
import { ErrorBox } from "./StarterSession";
import { StarterManage } from "./StarterManage";

const START = "/dashboard/member/starter/start";
const sessionHref = (id: string) => `/dashboard/member/starter/session/${encodeURIComponent(id)}`;

function sessionFacts(t: StarterTask): string {
  return [minutesLabel(t.sessionMinutes), exerciseCountLabel(t.exercises.length)].filter(Boolean).join(" · ");
}

/** Shown when the member has no running starter program. */
export function StarterEmpty() {
  return (
    <DSCard className="p-6">
      <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>Start a free program</h2>
      <p className="mt-1.5 max-w-[56ch] text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
        A free beginner workout program. Answer three quick questions, look at the first week, and start when
        you are ready. No coach needed, and you can leave any time.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={START} className="btn-primary-v2 lg min-h-11">Start a free program</Link>
        <Link href="/marketplace" className="btn-ghost-v2 lg min-h-11">Find a coach</Link>
      </div>
    </DSCard>
  );
}

/**
 * The member's running starter program: today's session, catch-up sessions,
 * what is coming up, and the manage tools. Plain counts only.
 */
export function StarterHome() {
  const { data, isLoading, isError, error, refetch } = useActiveStarter();

  if (isLoading) return <AsyncSpinner size="page" label="Loading your program" />;
  if (isError) {
    return (
      <ErrorBox
        message={error instanceof Error ? error.message : "Could not load your program. Try again."}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) return <StarterEmpty />;

  const { program, tasks } = data;
  const m = starterTodayModel({ tasks, program, today: localToday() });
  const today = m.task;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={m.dayLabel ?? "Starter program"}
        title={program.name}
        subtitle={m.progressLine ?? undefined}
      />

      <section aria-labelledby="starter-today-h">
        <Eyebrow as="h2" id="starter-today-h" className="mb-2">Today</Eyebrow>
        <DSCard className="p-5">
          {today ? (
            <>
              <h3 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>{today.title}</h3>
              <p className="mt-0.5 font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>
                {sessionFacts(today) || "Today's session"}
              </p>
              {today.exercises.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2" aria-label="Today's exercises">
                  {today.exercises.map((e, i) => (
                    <li key={`${e.name}-${i}`} className="flex items-center gap-3">
                      {hasExerciseIllustration(e.mediaId) ? (
                        <span
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-(--r-2)"
                          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
                        >
                          <ExerciseIllustration mediaId={e.mediaId} className="block h-full w-full object-contain" />
                        </span>
                      ) : (
                        <span aria-hidden="true" className="h-14 w-14 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 text-[15px]" style={{ color: "var(--ink)" }}>{e.name}</span>
                      <span className="font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>{exerciseDose(e)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4" aria-live="polite">
                {m.state === "pending" ? (
                  <Link href={sessionHref(today.id)} className="btn-primary-v2 lg min-h-11">Open session</Link>
                ) : (
                  <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                    {m.state === "done" ? "Done for today." : "Skipped for today."}{" "}
                    <span className="font-normal" style={{ color: "var(--fg-2)" }}>{m.restNote}</span>
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-[15px]" style={{ color: "var(--ink)" }}>
              {m.state === "waiting" ? `Your program ${m.dayLabel?.toLowerCase() ?? "starts soon"}.` : m.restNote}
            </p>
          )}
          <p className="mt-4 text-[13px] leading-snug" style={{ color: "var(--fg-3)" }}>{STARTER_STOP_NOTE}</p>
        </DSCard>
      </section>

      {m.catchUp.length > 0 && (
        <section aria-labelledby="starter-catchup-h">
          <Eyebrow as="h2" id="starter-catchup-h" className="mb-2">Catch up</Eyebrow>
          <ul className="flex flex-col gap-2">
            {m.catchUp.map((r) => (
              <li key={r.task.id}>
                <ListRow
                  title={r.task.title}
                  meta={
                    r.state === "done_late"
                      ? `Done late. ${r.note}`
                      : r.state === "missed"
                        ? `Missed. ${r.note}`
                        : r.note
                  }
                  href={r.state === "open" ? sessionHref(r.task.id) : undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {m.upcoming.length > 0 && (
        <section aria-labelledby="starter-next-h">
          <Eyebrow as="h2" id="starter-next-h" className="mb-2">Coming up</Eyebrow>
          <ul className="flex flex-col gap-2">
            {m.upcoming.map((t) => (
              <li key={t.id}>
                <ListRow
                  title={t.title}
                  meta={[formatTaskDay(t.scheduledFor), exerciseCountLabel(t.exercises.length)].filter(Boolean).join(" · ")}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <StarterManage program={program} />
    </div>
  );
}
