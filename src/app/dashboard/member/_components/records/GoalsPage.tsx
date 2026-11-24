"use client";

import { useId, useMemo, useState } from "react";
import { ChipGroup, DSCard, Eyebrow, IconTile, PageHeader, ProgressBar } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import {
  GOAL_METRICS,
  GOAL_TARGET_MAX,
  GOAL_TARGET_MIN,
  GOAL_TEXT_MAX,
  GOALS_MAX_ACTIVE,
  type GoalKind,
  type GoalMetric,
  type MemberGoal,
  type WeekStart,
} from "@/lib/api/memberGoals";
import {
  useCreateGoal,
  useDeleteGoal,
  useGoalProgress,
  useGoals,
  useSetWeekStart,
  useUpdateGoal,
} from "@/lib/queries/ownRecords";
import {
  ARCHIVED,
  GOAL_METRIC_CATEGORY,
  GOAL_METRIC_ICON,
  METRIC_LABELS,
  METRIC_NOTES,
  NO_GOALS_YET,
  cleanGoalText,
  joinProgress,
  progressText,
  shortDate,
  toGoalWeekStart,
  weekRuleText,
  type GoalView,
} from "@/lib/records/goals";
import { categoryTone } from "@/lib/ui/tones";
import { ConfirmDelete, LoadError, SkeletonRows } from "./parts";
import { RecordsTabs } from "./RecordsTabs";
import styles from "./records.module.css";

const TARGETS = Array.from({ length: GOAL_TARGET_MAX - GOAL_TARGET_MIN + 1 }, (_, i) => String(GOAL_TARGET_MIN + i));
const KIND_OPTIONS: { value: GoalKind; label: string }[] = [
  { value: "free_text", label: "No, just words" },
  { value: "weekly_target", label: "A number each week" },
];
const WEEK_OPTIONS: { value: WeekStart; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
];

const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/**
 * Add or change a goal. The words are the member's own: no prefilled wording
 * and no suggested number. A weekly target counts what the member really
 * logs; a goal in their own words has no number. Mirrors mobile GoalEditScreen.
 */
function GoalForm({ goal, onDone }: { goal?: MemberGoal; onDone: () => void }) {
  const online = useOnline();
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const del = useDeleteGoal();
  const textId = useId();
  const [text, setText] = useState(goal?.text ?? "");
  const [kind, setKind] = useState<GoalKind>(goal?.kind ?? "free_text");
  const [metric, setMetric] = useState<GoalMetric>(goal?.metric ?? "fasts");
  const [target, setTarget] = useState<number>(goal?.target ?? 3);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const busy = create.isPending || update.isPending || del.isPending;
  const clean = cleanGoalText(text);
  const weekly = (goal ? goal.kind : kind) === "weekly_target";
  const left = GOAL_TEXT_MAX - text.length;

  const save = async () => {
    if (!clean || busy) return;
    setError(null);
    if (!online) return setError(OFFLINE_WRITE_MESSAGE);
    try {
      if (goal) {
        await update.mutateAsync({ id: goal.id, input: { text: clean, ...(goal.kind === "weekly_target" ? { metric, target } : {}) } });
        toast("Goal changed", "success");
      } else {
        await create.mutateAsync({ text: clean, kind, ...(kind === "weekly_target" ? { metric, target } : {}) });
        toast("Goal added", "success");
      }
      onDone();
    } catch (e) {
      setError(errorText(e, goal ? "The goal could not be changed. Try again." : "The goal could not be added. Try again."));
    }
  };

  const remove = async () => {
    if (!goal) return;
    try {
      await del.mutateAsync(goal.id);
      setConfirm(false);
      toast("Goal deleted", "success");
      onDone();
    } catch (e) {
      setConfirm(false);
      setError(errorText(e, "The goal could not be deleted. Try again."));
    }
  };

  return (
    <DSCard className="p-4 sm:p-5">
      <form
        className={styles.stack}
        data-testid="goal-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <h2 className={styles.label}>{goal ? "Your goal" : "Add a goal"}</h2>
        <label htmlFor={textId} className={styles.sub}>
          Your goal, in your own words
        </label>
        <input
          id={textId}
          className={styles.field}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={GOAL_TEXT_MAX}
          placeholder={weekly ? "For example: Fast on weekdays" : "For example: Feel stronger by January"}
          data-testid="goal-text"
        />
        {left <= 20 && <p className={styles.small}>{`${left} characters left`}</p>}

        {!goal && (
          <>
            <Eyebrow as="h3">Does it have a number?</Eyebrow>
            <ChipGroup label="Does it have a number?" options={KIND_OPTIONS} value={kind} onChange={setKind} disabled={busy} />
          </>
        )}

        {weekly && (
          <div className={`${styles.stack} rounded-(--r-2) border border-border p-3`} data-testid="goal-weekly">
            <Eyebrow as="h3">What to count</Eyebrow>
            {/* Category chips: the chosen one takes its category's colour. */}
            <ChipGroup
              label="What to count"
              value={metric}
              onChange={setMetric}
              disabled={busy}
              options={GOAL_METRICS.map((m) => ({ value: m, label: METRIC_LABELS[m], category: GOAL_METRIC_CATEGORY[m], icon: GOAL_METRIC_ICON[m] }))}
            />
            <div className={styles.metricNote}>
              <IconTile icon={GOAL_METRIC_ICON[metric]} tone={categoryTone(GOAL_METRIC_CATEGORY[metric])} size="sm" />
              <p className={styles.sub}>{METRIC_NOTES[metric]}</p>
            </div>
            <Eyebrow as="h3">Times a week</Eyebrow>
            <ChipGroup
              label="Times a week"
              value={String(target)}
              onChange={(v) => setTarget(Number(v))}
              disabled={busy}
              options={TARGETS.map((n) => ({
                value: n,
                label: n,
                category: GOAL_METRIC_CATEGORY[metric],
                ariaLabel: `${n} ${n === "1" ? "time" : "times"} a week`,
              }))}
            />
          </div>
        )}

        {!goal && <p className={styles.small}>{`You can keep up to ${GOALS_MAX_ACTIVE} active goals.`}</p>}
        {error && (
          <p className={styles.error} role="alert" data-testid="goal-error">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="submit" className={`btn-primary-v2 ${styles.btn}`} disabled={!clean || busy} aria-busy={create.isPending || update.isPending}>
            {goal ? "Save changes" : "Add goal"}
          </button>
          <button type="button" className={`btn-ghost-v2 ${styles.btn}`} onClick={onDone} disabled={busy}>
            Cancel
          </button>
          {goal && (
            <button type="button" className={`btn-ghost-v2 ${styles.dangerBtn}`} onClick={() => setConfirm(true)} disabled={busy}>
              Delete this goal
            </button>
          )}
        </div>
      </form>
      {goal && (
        <ConfirmDelete
          open={confirm}
          title="Delete this goal?"
          body="It will be gone for good. Archive it instead to keep it out of sight."
          busy={del.isPending}
          onKeep={() => setConfirm(false)}
          onDelete={() => void remove()}
        />
      )}
    </DSCard>
  );
}

/** A goal as it stands this week. Neutral: the words are the member's. */
function GoalCard({ view, weekStart, onEdit }: { view: GoalView; weekStart: WeekStart; onEdit: () => void }) {
  const { goal, progress } = view;
  const online = useOnline();
  const update = useUpdateGoal();
  const [error, setError] = useState<string | null>(null);
  const weekly = goal.kind === "weekly_target" && goal.target != null;
  const target = progress?.target ?? goal.target ?? 0;
  const text = weekly && progress ? progressText(progress.count, target) : null;
  const written = shortDate(goal.created_at);

  const archive = async () => {
    setError(null);
    if (!online) return setError(OFFLINE_WRITE_MESSAGE);
    try {
      await update.mutateAsync({ id: goal.id, input: { active: false }, failed: "That could not be saved. Try again." });
      toast("Goal archived", "success");
    } catch (e) {
      setError(errorText(e, "That could not be saved. Try again."));
    }
  };

  return (
    <li style={{ listStyle: "none" }} data-testid={`goal-${goal.id}`}>
      <DSCard className="flex flex-col gap-2 p-4">
        <div className={styles.goalHead}>
          <p className={styles.goalTitle}>{goal.text}</p>
          {text && (
            <span className={styles.count} data-testid={`goal-count-${goal.id}`}>
              {text}
            </span>
          )}
        </div>
        {weekly && progress ? (
          <>
            <ProgressBar value={Math.min(progress.count, target)} max={Math.max(1, target)} label={`${goal.text}, this week`} valueText={`${text} this week`} />
            <p className={styles.small}>{weekRuleText(weekStart)}</p>
            {goal.metric && <p className={styles.small}>{METRIC_NOTES[goal.metric]}</p>}
          </>
        ) : weekly ? (
          <p className={styles.small}>{`Goal of ${goal.target} a week.`}</p>
        ) : (
          <p className={styles.small}>{`A goal without a number.${written ? ` Written ${written}.` : ""}`}</p>
        )}
        <div className={styles.actions}>
          <button type="button" className={`btn-ghost-v2 ${styles.btn}`} onClick={onEdit} aria-label={`Edit ${goal.text}`}>
            Edit
          </button>
          <button
            type="button"
            className={`btn-ghost-v2 ${styles.btn}`}
            onClick={() => void archive()}
            disabled={update.isPending}
            aria-label={`Archive ${goal.text}`}
          >
            Archive
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </DSCard>
    </li>
  );
}

/** An archived goal: restore it, or delete it for good. */
function ArchivedRow({ goal }: { goal: MemberGoal }) {
  const online = useOnline();
  const update = useUpdateGoal();
  const del = useDeleteGoal();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = async () => {
    setError(null);
    if (!online) return setError(OFFLINE_WRITE_MESSAGE);
    try {
      await update.mutateAsync({ id: goal.id, input: { active: true }, failed: "That could not be saved. Try again." });
      toast("Goal restored", "success");
    } catch (e) {
      setError(errorText(e, "That could not be saved. Try again."));
    }
  };
  const remove = async () => {
    try {
      await del.mutateAsync(goal.id);
      setConfirm(false);
      toast("Goal deleted", "success");
    } catch (e) {
      setConfirm(false);
      setError(errorText(e, "The goal could not be deleted. Try again."));
    }
  };

  return (
    <li style={{ listStyle: "none" }} data-testid={`archived-${goal.id}`}>
      <DSCard flat className="flex flex-col gap-2 p-4">
        <p className={styles.goalTitle}>{goal.text}</p>
        <p className={styles.small}>{ARCHIVED}</p>
        <div className={styles.actions}>
          <button type="button" className={`btn-ghost-v2 ${styles.btn}`} onClick={() => void restore()} disabled={update.isPending} aria-label={`Restore ${goal.text}`}>
            Restore
          </button>
          <button type="button" className={`btn-ghost-v2 ${styles.dangerBtn}`} onClick={() => setConfirm(true)} aria-label={`Delete ${goal.text}`}>
            Delete
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </DSCard>
      <ConfirmDelete
        open={confirm}
        title="Delete this goal?"
        body="It will be gone for good."
        busy={del.isPending}
        onKeep={() => setConfirm(false)}
        onDelete={() => void remove()}
      />
    </li>
  );
}

/**
 * Goals: the member's own goals. A weekly target shows "N of M" and a plain
 * bar from what they really logged this week; a goal in their own words
 * shows no number. No streaks, no "missed", no scores and no advice.
 * Mirrors binectics-mobile GoalsView.
 */
export function GoalsPage() {
  const goals = useGoals();
  const progress = useGoalProgress();
  const setWeek = useSetWeekStart();
  const online = useOnline();
  // "new" = the add form; a goal id = that goal's edit form.
  const [editing, setEditing] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [weekError, setWeekError] = useState<string | null>(null);

  const all = useMemo(() => goals.data ?? [], [goals.data]);
  const active = useMemo(() => all.filter((g) => g.active), [all]);
  const archived = useMemo(() => all.filter((g) => !g.active), [all]);
  const views = useMemo(() => joinProgress(active, progress.data?.goals ?? []), [active, progress.data]);
  const weekStart = toGoalWeekStart(progress.data?.week_start);
  const atLimit = active.length >= GOALS_MAX_ACTIVE;

  const pickWeek = async (w: WeekStart) => {
    if (w === weekStart) return;
    setWeekError(null);
    if (!online) return setWeekError(OFFLINE_WRITE_MESSAGE);
    try {
      await setWeek.mutateAsync(w);
    } catch (e) {
      setWeekError(errorText(e, "That could not be saved. Try again."));
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Log" title="Goals" />
      <RecordsTabs current="goals" />

      {goals.isLoading ? (
        <SkeletonRows count={2} height={96} label="Loading your goals" />
      ) : goals.isError ? (
        <LoadError title="We could not load your goals" onRetry={() => void goals.refetch()} testId="goals-error" />
      ) : (
        <div className={`${styles.stack} ${styles.rise}`}>
          {views.length === 0 && editing !== "new" ? (
            <DSCard className="p-4" >
              <h2 className={styles.label} data-testid="goals-empty">
                {NO_GOALS_YET}
              </h2>
            </DSCard>
          ) : (
            <ul className={styles.list} aria-label="Your goals">
              {views.map((v) =>
                editing === v.goal.id ? (
                  <li key={v.goal.id} style={{ listStyle: "none" }}>
                    <GoalForm goal={v.goal} onDone={() => setEditing(null)} />
                  </li>
                ) : (
                  <GoalCard key={v.goal.id} view={v} weekStart={weekStart} onEdit={() => setEditing(v.goal.id)} />
                ),
              )}
            </ul>
          )}

          {editing === "new" ? (
            <GoalForm onDone={() => setEditing(null)} />
          ) : (
            <div>
              <button
                type="button"
                className={`btn-ghost-v2 ${styles.btn}`}
                onClick={() => setEditing("new")}
                disabled={atLimit}
                aria-describedby={atLimit ? "goals-limit" : undefined}
              >
                Add a goal
              </button>
            </div>
          )}
          {atLimit && (
            <p id="goals-limit" className={styles.sub} data-testid="goals-limit">
              You have 10 active goals, the most you can keep. Archive one to add another.
            </p>
          )}

          <Eyebrow as="h2" className={styles.day}>
            Your week starts on
          </Eyebrow>
          <ChipGroup label="Your week starts on" options={WEEK_OPTIONS} value={weekStart} onChange={(w) => void pickWeek(w)} disabled={setWeek.isPending} />
          {weekError && (
            <p className={styles.error} role="alert">
              {weekError}
            </p>
          )}

          {archived.length > 0 && (
            <>
              <div>
                <button
                  type="button"
                  className={`btn-ghost-v2 ${styles.btn}`}
                  onClick={() => setShowArchived((v) => !v)}
                  aria-expanded={showArchived}
                  aria-controls="archived-goals"
                >
                  {showArchived ? "Hide archived goals" : `Archived goals (${archived.length})`}
                </button>
              </div>
              {showArchived && (
                <ul id="archived-goals" className={styles.list} aria-label="Archived goals">
                  {archived.map((g) => (
                    <ArchivedRow key={g.id} goal={g} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
