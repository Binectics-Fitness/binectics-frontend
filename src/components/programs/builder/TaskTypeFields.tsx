"use client";

import { useEffect, useId, useState } from "react";
import ExercisePicker from "../ExercisePicker";
import { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { loadLibrary, type LibraryState } from "../exerciseLibraryCache";
import {
  DEMO_ART_NOTE,
  MAX_INLINE_EXERCISES,
  PROGRAM_EXERCISE_NAME_MAX,
  UNAVAILABLE_LIBRARY,
  libraryRef,
  truncateName,
} from "@/lib/exercises/library";
import { BUILDER_COPY } from "./copy";
import { Btn, Chip, Seg, errStyle, errText, fieldLabel, fieldLabelStyle, inputStyle, metaStyle } from "./controls";
import type { ContentOption } from "./useContentOptions";
import {
  HEALTH_KEYS,
  HEALTH_METRICS,
  MEASURE_METRICS,
  OWN_LOG,
  measureDefaultTitle,
  measureMetric,
  isTimedRow,
  newExercise,
  taskIssue,
  type AutoSource,
  type BuilderTask,
} from "./model";

const C = BUILDER_COPY;
const mini: React.CSSProperties = {
  width: 60,
  minHeight: 36,
  border: "1px solid var(--border-2)",
  borderRadius: 6,
  background: "var(--bg)",
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  color: "var(--ink)",
};
const digits = (v: string) => v.replace(/\D/g, "");
const decimal = (v: string) => v.replace(/[^\d.]/g, "");

/**
 * The fields a task type adds to the inspector: exercises (workout), the form
 * or meal plan (as chips, with "+ New" in a sheet), what to record and the
 * target (measurement), and "Ticks itself" (habit).
 */
export function TaskTypeFields({
  task,
  showIssues,
  forms,
  mealPlans,
  onChange,
  onNewContent,
}: {
  task: BuilderTask;
  showIssues: boolean;
  forms: ContentOption[];
  mealPlans: ContentOption[];
  onChange: (patch: Partial<BuilderTask>) => void;
  /** P3-2: open the form or meal plan builder in a sheet. */
  onNewContent: (kind: "form" | "meal") => void;
}) {
  const issue = showIssues ? taskIssue(task) : null;
  switch (task.kind) {
    case "workout":
      return <WorkoutFields task={task} error={issue?.kind === "workout"} onChange={onChange} />;
    case "checkin":
      return (
        <ContentChips
          label={C.checkin.label}
          options={forms}
          value={task.form_id}
          missing={C.checkin.unavailable}
          none={C.checkin.none}
          newLabel={C.checkin.newForm}
          error={issue?.kind === "form" ? C.checkin.error : null}
          onPick={(o) => onChange({ form_id: o.id, contentTitle: o.title })}
          onNew={() => onNewContent("form")}
        />
      );
    case "meal":
      return (
        <ContentChips
          label={C.meal.label}
          options={mealPlans}
          value={task.meal_plan_id}
          missing={C.meal.unavailable}
          none={C.meal.none}
          newLabel={C.meal.newPlan}
          error={issue?.kind === "meal" ? C.meal.error : null}
          onPick={(o) => onChange({ meal_plan_id: o.id, contentTitle: o.title })}
          onNew={() => onNewContent("meal")}
        />
      );
    case "measure":
      return <MeasureFields task={task} onChange={onChange} />;
    case "habit":
    {
      // A number out of range says so as soon as it is typed, not only after Start.
      const now = taskIssue(task);
      const numberError = now?.kind === "number" && (showIssues || task.autoN.trim() !== "") ? now.field : null;
      return <HabitTicks task={task} error={numberError} onChange={onChange} />;
    }
    default:
      return null;
  }
}

// ── Workout ──────────────────────────────────────────────────────────

function WorkoutFields({ task, error, onChange }: { task: BuilderTask; error: boolean; onChange: (p: Partial<BuilderTask>) => void }) {
  const [lib, setLib] = useState<LibraryState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let live = true;
    void loadLibrary().then((s) => live && setLib(s));
    return () => {
      live = false;
    };
  }, []);
  const library = lib.status === "ready" ? lib.library : UNAVAILABLE_LIBRARY;
  const ex = task.exercises;
  const timedIds = new Set(library.exercises.filter((x) => x.timed).map((x) => x.id));
  const full = ex.length >= MAX_INLINE_EXERCISES;
  const set = (i: number, patch: Partial<BuilderTask["exercises"][number]>) =>
    onChange({ exercises: ex.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  if (task.workout_plan_id) {
    return <p className="text-[13px]" style={metaStyle}>{C.workout.linked}</p>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className={fieldLabel} style={fieldLabelStyle}>{C.workout.exercises}</span>
      {ex.length > 0 && (
        <div>
          {ex.map((e, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
              <span className="text-[13px] tabular-nums" style={{ ...metaStyle, width: 14 }}>{i + 1}</span>
              {e.library_exercise_id ? (
                <span className="flex-1 min-w-0 font-medium truncate" style={{ color: "var(--ink)" }}>{e.name}</span>
              ) : (
                <input
                  value={e.name}
                  maxLength={PROGRAM_EXERCISE_NAME_MAX}
                  onChange={(v) => set(i, { name: v.target.value })}
                  aria-label={C.workout.customName(i + 1)}
                  className="flex-1 min-w-0"
                  style={{ ...inputStyle(), minHeight: 36, fontSize: 14 }}
                />
              )}
              <input style={mini} inputMode="numeric" aria-label={C.workout.sets(e.name || C.workout.customName(i + 1))} value={e.sets} onChange={(v) => set(i, { sets: digits(v.target.value) })} />
              <span className="text-[13px]" style={metaStyle}>×</span>
              {isTimedRow(e, timedIds) ? (
                <>
                  <input style={mini} inputMode="numeric" aria-label={C.workout.seconds(e.name || C.workout.customName(i + 1))} value={e.seconds} onChange={(v) => set(i, { seconds: digits(v.target.value) })} />
                  <span className="shrink-0 text-[13px]" style={{ ...metaStyle, width: 10 }} aria-hidden="true">s</span>
                </>
              ) : (
                <>
                  <input style={mini} inputMode="numeric" aria-label={C.workout.reps(e.name || C.workout.customName(i + 1))} value={e.reps} onChange={(v) => set(i, { reps: digits(v.target.value) })} />
                  <span className="shrink-0" style={{ width: 10 }} aria-hidden="true" />
                </>
              )}
              <button
                type="button"
                aria-label={C.workout.remove(e.name || C.workout.customName(i + 1))}
                onClick={() => onChange({ exercises: ex.filter((_, j) => j !== i) })}
                className="text-[13px]"
                style={{ ...metaStyle, minWidth: 32, minHeight: 36 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {open && library.available ? (
        <ExercisePicker
          exercises={library.exercises}
          onPick={(p) => !full && onChange({ exercises: [...ex, newExercise(truncateName(p.name, PROGRAM_EXERCISE_NAME_MAX), libraryRef(p.id), p.timed === true)] })}
          onClose={() => setOpen(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {library.available && (
            <Btn variant="ghost" size="sm" disabled={full} onClick={() => setOpen(true)}>{C.workout.addExercises}</Btn>
          )}
          <Btn variant="ghost" size="sm" disabled={full} onClick={() => onChange({ exercises: [...ex, newExercise("")] })}>{C.workout.addCustom}</Btn>
        </div>
      )}
      {full && <span className="text-[13px]" style={metaStyle}>{C.workout.full(MAX_INLINE_EXERCISES)}</span>}
      {error && <span className={errText} style={errStyle}>{C.workout.error}</span>}
      <span className="text-[13px]" style={metaStyle}>{C.workout.defaults}</span>
      {ex.some((e) => hasExerciseIllustration(e.library_exercise_id)) && !open && <span className="text-[13px]" style={metaStyle}>{DEMO_ART_NOTE}.</span>}
    </div>
  );
}

// ── Form / meal plan ─────────────────────────────────────────────────

function ContentChips({
  label,
  options,
  value,
  missing,
  none,
  newLabel,
  error,
  onPick,
  onNew,
}: {
  label: string;
  options: ContentOption[];
  value: string;
  missing: string;
  none: string;
  newLabel: string;
  error: string | null;
  onPick: (o: ContentOption) => void;
  onNew: () => void;
}) {
  // A stale link stays visible (and replaceable) rather than silently blank.
  const shown = value && !options.some((o) => o.id === value) ? [...options, { id: value, title: missing }] : options;
  return (
    <div className="flex flex-col gap-1.5">
      <span className={fieldLabel} style={fieldLabelStyle}>{label}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {shown.map((o) => (
          <Chip key={o.id} pressed={o.id === value} onClick={() => onPick(o)}>{o.title}</Chip>
        ))}
        <Chip onClick={onNew}>{newLabel}</Chip>
      </div>
      {options.length === 0 && !value && <span className="text-[13px]" style={metaStyle}>{none}</span>}
      {error && <span className={errText} style={errStyle}>{error}</span>}
    </div>
  );
}

// ── Measurement ──────────────────────────────────────────────────────

function MeasureFields({ task, onChange }: { task: BuilderTask; onChange: (p: Partial<BuilderTask>) => void }) {
  const targetId = useId();
  const m = measureMetric(task.metric);
  const options = MEASURE_METRICS.map((x) => [x.key as string, x.label] as const);
  // A metric saved before the chips existed stays selectable as it is.
  const all = m || !task.metric ? options : [...options, [task.metric, C.measure.other(task.metric)] as const];
  const pick = (key: string) => {
    const keepTitle = task.title.trim() !== "" && !MEASURE_METRICS.some((x) => measureDefaultTitle(x.key) === task.title);
    onChange({ metric: key, ...(keepTitle ? {} : { title: measureDefaultTitle(key) }) });
  };
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className={fieldLabel} style={fieldLabelStyle}>{C.measure.label}</span>
        <Seg label={C.measure.label} options={all} value={task.metric} onChange={pick} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={targetId} className={fieldLabel} style={fieldLabelStyle}>{C.measure.target}</label>
        <div className="flex items-center gap-2">
          <input
            id={targetId}
            inputMode="decimal"
            value={task.target}
            onChange={(e) => onChange({ target: decimal(e.target.value) })}
            style={{ ...inputStyle(), width: 120, fontVariantNumeric: "tabular-nums" }}
          />
          <span className="text-[13px]" style={metaStyle}>{C.measure.byTheEnd(m?.unit ?? "")}</span>
        </div>
        <span className="text-[13px]" style={metaStyle}>{C.measure.targetHelp}</span>
      </div>
    </>
  );
}

// ── Habit: ticks itself ──────────────────────────────────────────────

function HabitTicks({ task, error, onChange }: { task: BuilderTask; error: string | null; onChange: (p: Partial<BuilderTask>) => void }) {
  const numId = useId();
  if (task.kept_auto_rule) return <p className="text-[13px]" style={metaStyle}>{C.ticks.keptRule}</p>;
  const h = HEALTH_METRICS[task.hm];
  const suffix = task.auto === "water" ? C.ticks.waterSuffix : task.auto === "fast" ? C.ticks.fastSuffix : h.suffix;
  const setAuto = (v: AutoSource) =>
    onChange({ auto: v, autoN: v === "water" || v === "fast" ? OWN_LOG[v].dflt : v === "health" ? h.dflt : "" });
  return (
    <div className="flex flex-col gap-1.5">
      <span className={fieldLabel} style={fieldLabelStyle}>{C.ticks.label}</span>
      <Seg
        label={C.ticks.label}
        options={[
          ["", C.ticks.no],
          ["water", C.ticks.water],
          ["fast", C.ticks.fast],
          ["health", C.ticks.health],
        ] as const}
        value={task.auto}
        onChange={setAuto}
      />
      {task.auto === "health" && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={C.ticks.health}>
          {HEALTH_KEYS.map((k) => (
            <Chip key={k} pressed={task.hm === k} onClick={() => onChange({ hm: k, autoN: HEALTH_METRICS[k].dflt })}>
              {HEALTH_METRICS[k].label}
            </Chip>
          ))}
        </div>
      )}
      {task.auto && (
        <>
          <div className="flex items-center gap-2">
            <input
              id={numId}
              inputMode="numeric"
              value={task.autoN}
              onChange={(e) => onChange({ autoN: digits(e.target.value) })}
              aria-label={suffix}
              aria-invalid={!!error || undefined}
              style={{ ...inputStyle(!!error), width: 90, fontVariantNumeric: "tabular-nums" }}
            />
            <span className="text-[13px]" style={metaStyle}>{suffix}</span>
          </div>
          {error && <span className={errText} style={errStyle}>{error}</span>}
          <span className="text-[13px]" style={metaStyle}>{task.auto === "health" ? C.ticks.healthHelp : C.ticks.ownLogHelp}</span>
        </>
      )}
    </div>
  );
}
