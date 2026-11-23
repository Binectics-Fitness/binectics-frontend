"use client";

import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, IconTile, PageHeader } from "@/components/ds";
import { useActiveStarter, useStarterHistory, useStarterNumbers } from "@/lib/queries/starter";
import { loggedNumbers, weeklyHistory } from "@/lib/starter/history";
import { localToday, taskDay } from "@/lib/starter/model";
import { StarterTaskStatus } from "@/lib/starter/types";
import { ErrorBox } from "./StarterSession";

const START = "/dashboard/member/starter/start";
const HOME = "/dashboard/member/starter";

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Could not load your history. Try again.");

/**
 * The member's own record of their starter program (web port of mobile
 * StarterHistoryScreen): a plain list by week of what they did, did late,
 * skipped or missed, then the numbers they chose to log. Only counts and
 * their own entries. No streaks, scores or percentages.
 */
export function StarterHistory() {
  const active = useActiveStarter();
  const program = active.data?.program ?? null;
  const history = useStarterHistory(program?.id);
  const numbersQuery = useStarterNumbers(history.isSuccess);

  const header = <PageHeader eyebrow="Starter program" title="Your history" subtitle={program?.name} />;
  const backLink = (
    <Link href={HOME} className="btn-ghost-v2 lg min-h-[44px]">
      Back to your program
    </Link>
  );

  if (active.isLoading || (program && history.isLoading)) {
    return (
      <>
        {header}
        <AsyncSpinner size="page" label="Loading your history" />
      </>
    );
  }
  if (active.isError || history.isError) {
    const retry = () => void (active.isError ? active.refetch() : history.refetch());
    return (
      <>
        {header}
        <ErrorBox message={errorText(active.error ?? history.error)} onRetry={retry} />
      </>
    );
  }
  if (!program) {
    return (
      <>
        {header}
        <DSCard className="p-5">
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
            No program running
          </h2>
          <EmptySlate
            mt="mt-1"
            message="Start a free program and your sessions are listed here as their days pass."
            action={
              <Link href={START} className="btn-primary-v2 lg min-h-[44px]">
                Start a free program
              </Link>
            }
          />
        </DSCard>
      </>
    );
  }

  // Today's session is not in the history list until tomorrow; the program's own agenda has it.
  const today = localToday();
  const extra = (active.data?.tasks ?? []).filter(
    (t) => taskDay(t.scheduledFor) === today && t.status !== StarterTaskStatus.Pending,
  );
  const days = history.data ?? [];
  const weeks = weeklyHistory({ days, extra, startedAt: program.startedAt });
  const titles = [...days.flatMap((d) => d.items), ...extra].map((t) => t.title).filter(Boolean);
  const numbers = numbersQuery.data
    ? loggedNumbers(numbersQuery.data, { sessionTitles: titles, startedAt: program.startedAt })
    : [];

  return (
    <div className="flex flex-col gap-6">
      {header}

      {weeks.length === 0 ? (
        <p className="text-[15px]" style={{ color: "var(--fg-2)" }}>
          Nothing to show yet. Your sessions are listed here as their days pass.
        </p>
      ) : (
        weeks.map((w) => (
          <section key={w.week} aria-labelledby={`hist-week-${w.week}`}>
            <Eyebrow as="h2" id={`hist-week-${w.week}`}>
              {w.label}
            </Eyebrow>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--fg-3)" }}>
              {w.from}
            </p>
            <p className="mb-2 mt-1 text-[15px] font-medium" style={{ color: "var(--ink)" }}>
              {w.summary}
            </p>
            <DSCard>
              <ul aria-label={`${w.label} sessions`}>
                {w.rows.map((r, i) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                    style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                  >
                    {/* A session is a workout: a move tile. The status stays plain text, so the row keeps one tone. */}
                    <IconTile icon={Dumbbell} tone="move" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                        {r.title}
                      </span>
                      <span className="block text-[13px]" style={{ color: "var(--fg-3)" }}>
                        {r.dayLabel}
                      </span>
                    </span>
                    <span className="font-mono text-[13px]" style={{ color: "var(--fg-2)" }} data-status={r.status}>
                      {r.statusLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </DSCard>
          </section>
        ))
      )}

      <section aria-labelledby="hist-numbers-h">
        <Eyebrow as="h2" id="hist-numbers-h" className="mb-2">
          Your numbers
        </Eyebrow>
        {numbersQuery.isError ? (
          <p className="text-[15px]" style={{ color: "var(--fg-2)" }}>
            Your numbers could not be loaded just now.
          </p>
        ) : numbersQuery.isLoading ? (
          <AsyncSpinner label="Loading your numbers" />
        ) : numbers.length === 0 ? (
          <p className="text-[15px]" style={{ color: "var(--fg-2)" }}>
            Numbers you add when you finish a session are listed here. You only add them if you want to.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {numbers.map((n) => (
              <li key={n.id}>
                <DSCard className="p-4">
                  <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                    {n.title}
                  </h3>
                  <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    {n.dayLabel} · {n.minutes} {n.minutes === 1 ? "minute" : "minutes"}
                  </p>
                  {n.lines.map((l, i) => (
                    <p key={i} className="mt-1 font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>
                      {l}
                    </p>
                  ))}
                </DSCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>{backLink}</div>
    </div>
  );
}
