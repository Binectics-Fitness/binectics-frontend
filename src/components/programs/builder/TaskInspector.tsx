"use client";

import { useId, type ReactNode } from "react";
import type { ProgramCadence } from "@/lib/api/programs";
import { BUILDER_COPY, TASK_TYPE_COPY } from "./copy";
import { Chip, LinkBtn, Seg, Stepper, errStyle, errText, fieldLabel, fieldLabelStyle, inputStyle, metaStyle, TaskTile } from "./controls";
import {
  fromWeek,
  onWeeks,
  phaseWeeks,
  setFromWeek,
  setToWeek,
  snapToWeeks,
  taskIssue,
  taskTone,
  toWeek,
  type BuilderProgram,
  type BuilderTask,
} from "./model";

const C = BUILDER_COPY.inspector;
const CADENCES: ReadonlyArray<readonly [ProgramCadence, string]> = [
  ["once", BUILDER_COPY.cadenceOptions.once],
  ["daily", BUILDER_COPY.cadenceOptions.daily],
  ["weekly", BUILDER_COPY.cadenceOptions.weekly],
  ["n_per_week", BUILDER_COPY.cadenceOptions.n_per_week],
];

/**
 * The selected task, edited in place (right panel). Order as drawn: Title,
 * the type's own fields, How often, Weeks, Note for your client, Remove task.
 */
export function TaskInspector({
  program,
  task,
  showIssues,
  typeFields,
  onChange,
  onRemove,
  onClose,
}: {
  program: BuilderProgram;
  task: BuilderTask;
  /** After "Start a client" was pressed: every problem shows. */
  showIssues: boolean;
  /** The type's own fields (exercises, form, metric, ticks itself…). */
  typeFields?: ReactNode;
  onChange: (patch: Partial<BuilderTask>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const titleErrId = useId();
  const noteId = useId();
  const issue = showIssues ? taskIssue(task) : null;
  const titleError = issue?.kind === "title";
  const optionalTitle = task.kind === "checkin" || task.kind === "meal";
  const pw = phaseWeeks(program, task.phase);
  const from = fromWeek(task);
  const to = toWeek(program, task);
  const phaseName = program.split ? program.phases[task.phase]?.name ?? "" : "";
  const isCustom = task.cadence === "custom";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <TaskTile kind={task.kind} tone={taskTone(task)} water={task.kind === "habit" && task.auto === "water"} />
        <span className="flex-1 text-[17px] font-medium" style={{ color: "var(--ink)" }}>{TASK_TYPE_COPY[task.kind].label}</span>
        <LinkBtn onClick={onClose}>{C.close}</LinkBtn>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={titleId} className={fieldLabel} style={fieldLabelStyle}>{optionalTitle ? C.titleOptional : C.title}</label>
        <input
          id={titleId}
          value={task.title}
          maxLength={200}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={task.kind === "habit" ? C.habitPlaceholder : task.kind === "note" ? C.notePlaceholder : ""}
          aria-invalid={titleError || undefined}
          aria-describedby={titleError ? titleErrId : undefined}
          style={inputStyle(titleError)}
        />
        {titleError && <span id={titleErrId} className={errText} style={errStyle}>{C.titleError}</span>}
      </div>

      {typeFields}

      {!isCustom && (
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel} style={fieldLabelStyle}>{C.howOften}</span>
          <Seg label={C.howOften} options={CADENCES} value={task.cadence} onChange={(v) => onChange({ cadence: v, ...(v === "once" ? { days: null } : {}) })} />
          {task.cadence === "n_per_week" && (
            <div className="flex flex-wrap gap-2 mt-1" role="group" aria-label={BUILDER_COPY.cadenceOptions.n_per_week}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Chip key={n} pressed={task.n === n} onClick={() => onChange({ n })}>{C.timesPerWeek(n)}</Chip>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className={fieldLabel} style={fieldLabelStyle}>
          {task.cadence === "once" ? C.inWeek : C.weeks}
          {phaseName ? C.ofPhase(phaseName) : ""}
        </span>
        {onWeeks(task) ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <span className="flex items-center gap-2">
              <span className="text-[13px]" style={{ ...metaStyle, width: 34 }}>{task.cadence === "once" ? "" : C.from}</span>
              <Stepper
                value={from}
                text={C.weekN(from)}
                min={1}
                max={task.cadence === "once" ? pw : to}
                lessLabel={C.lessFrom}
                moreLabel={C.moreFrom}
                onChange={(v) => onChange(setFromWeek(program, task, v))}
              />
            </span>
            {task.cadence !== "once" && (
              <span className="flex items-center gap-2">
                <span className="text-[13px]" style={{ ...metaStyle, width: 34 }}>{C.to}</span>
                <Stepper
                  value={to}
                  text={C.weekN(to)}
                  min={from}
                  max={pw}
                  lessLabel={C.lessTo}
                  moreLabel={C.moreTo}
                  onChange={(v) => onChange(setToWeek(program, task, v))}
                />
              </span>
            )}
          </div>
        ) : (
          // Day-level offsets made on the old builder stay as they are until changed (04 §6).
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px]" style={metaStyle}>{C.legacyDays(task.start + 1, task.cadence === "once" ? null : task.days)}</span>
            <LinkBtn onClick={() => onChange(snapToWeeks(program, task))}>{C.changeToWeeks}</LinkBtn>
          </div>
        )}
      </div>

      {/* Always shown: a collapsed <details> hid the box until its label was
          clicked, and coaches missed it (demo finding 17). */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className={fieldLabel} style={fieldLabelStyle}>{C.note}</label>
        <textarea
          id={noteId}
          value={task.detail}
          maxLength={2000}
          onChange={(e) => onChange({ detail: e.target.value })}
          placeholder={C.notePlaceholderDetail}
          style={{ ...inputStyle(), padding: "10px 12px", minHeight: 72, resize: "vertical" }}
        />
      </div>

      <LinkBtn danger className="self-start" style={{ minHeight: 40 }} onClick={onRemove}>{C.remove}</LinkBtn>
    </div>
  );
}
