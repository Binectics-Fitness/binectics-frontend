"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AsyncSpinner } from "@/components/ds";
import { PlanGate } from "@/components/ds/PlanGate";
import { toast } from "@/components/Toast";
import { programsService, type ProgramTemplate } from "@/lib/api/programs";
import type { ProgramsRoleConfig } from "../config";
import { BUILDER_COPY, TASK_TYPE_COPY } from "./copy";
import { Btn, LinkBtn, TaskTile, metaStyle } from "./controls";
import { ClientWeek } from "./ClientWeek";
import { TaskInspector } from "./TaskInspector";
import { useAutosave } from "./useAutosave";
import {
  TASK_KINDS,
  cadenceText,
  count,
  fromVersion,
  newTask,
  phaseStartDay,
  summaryLine,
  taskIssue,
  taskLabel,
  taskTone,
  weeksOf,
  type BuilderProgram,
  type BuilderTask,
  type TaskKind,
} from "./model";

const C = BUILDER_COPY;

/**
 * The program page (P2-1): the plan on the left; on the right the selected
 * task, or "What your client sees" when nothing is selected. Every change
 * saves itself (P2-3).
 */
export default function ProgramBuilderPage({ config, id }: { config: ProgramsRoleConfig; id: string }) {
  const { Shell, basePath, navItem } = config;
  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [program, setProgram] = useState<BuilderProgram | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [menuPhase, setMenuPhase] = useState<number | null>(null);
  const [week, setWeek] = useState(1);
  /** Set once "Start a client" can be pressed (next change); until then problems show as typed. */
  const tried = false;

  const autosave = useAutosave(id, (detail) => setTemplate({ ...detail.template, publish_state: detail.publish_state ?? detail.template.publish_state }));

  useEffect(() => {
    let live = true;
    void programsService.getTemplate(id).then((res) => {
      if (!live) return;
      if (res.success && res.data) {
        setTemplate({ ...res.data.template, publish_state: res.data.publish_state ?? res.data.template.publish_state });
        setProgram(fromVersion(res.data.version));
      } else {
        setLoadError(res.status === 404 ? C.notFound : (res.message ?? C.loadFailed));
      }
    });
    return () => {
      live = false;
    };
  }, [id]);

  /** Every edit goes through here: state, then autosave. */
  const edit = useCallback(
    (next: BuilderProgram) => {
      setProgram(next);
      autosave.schedule(next);
    },
    [autosave],
  );
  const patchTask = (key: string, patch: Partial<BuilderTask>) => {
    if (!program) return;
    edit({ ...program, tasks: program.tasks.map((t) => (t.key === key ? { ...t, ...patch } : t)) });
  };

  const addTask = (kind: TaskKind, phase: number) => {
    if (!program) return;
    const t = newTask(kind, { phase, existing: program.tasks });
    edit({ ...program, tasks: [...program.tasks, t] });
    setSel(t.key);
    setMenuPhase(null);
  };

  const removeTask = (key: string) => {
    if (!program) return;
    const i = program.tasks.findIndex((t) => t.key === key);
    const removed = program.tasks[i];
    edit({ ...program, tasks: program.tasks.filter((t) => t.key !== key) });
    setSel(null);
    toast(C.inspector.removed, "info", {
      label: C.inspector.undo,
      onClick: () =>
        setProgram((cur) => {
          if (!cur) return cur;
          const tasks = [...cur.tasks];
          tasks.splice(Math.min(i, tasks.length), 0, removed);
          const next = { ...cur, tasks };
          autosave.schedule(next);
          return next;
        }),
    });
  };


  if (loadError) {
    return (
      <Shell activeItem={navItem} crumb={navItem}>
        <div className="flex flex-col gap-3 items-start">
          <p className="text-[15px]" style={{ color: "var(--ink)" }}>{loadError}</p>
          <Link href={basePath} className="underline text-[14px]" style={{ color: "var(--ink)" }}>{C.backToPrograms}</Link>
        </div>
      </Shell>
    );
  }
  if (!program || !template) {
    return (
      <Shell activeItem={navItem} crumb={navItem}>
        <AsyncSpinner size="page" label={C.header.nameLabel} />
      </Shell>
    );
  }

  const selected = program.tasks.find((t) => t.key === sel) ?? null;

  const savedText =
    autosave.state === "saving" ? C.header.saving : autosave.state === "error" ? C.header.notSaved : template.latest_published_version_no >= 1 && !template.publish_state?.has_unpublished_changes ? C.header.saved : C.header.draftSaved;
  const phases = program.split ? program.phases : [program.phases[0]];
  const kinds = TASK_KINDS.filter((k) => k !== "meal" || config.mealPlans);

  return (
    <Shell activeItem={navItem} crumb={navItem}>
      <div className="-m-4 lg:-m-7 flex flex-col flex-1 min-w-0 lg:flex-none lg:min-h-0 lg:h-[calc(100vh_-_56px)] lg:overflow-clip">
        {/* Header: name in place, save state, Settings, Start a client */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-3 lg:px-7 lg:py-4" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <Link href={basePath} className="text-[14px] underline underline-offset-[3px]" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>
            {C.header.programs}
          </Link>
          <span className="text-[13px]" style={metaStyle}>/</span>
          <input
            aria-label={C.header.nameLabel}
            value={program.name}
            maxLength={160}
            onChange={(e) => edit({ ...program, name: e.target.value })}
            className="min-w-0 flex-1 lg:flex-none"
            style={{ fontSize: 20, fontWeight: 500, minHeight: 44, border: "1px solid transparent", background: "transparent", maxWidth: 360, padding: "0 6px", borderRadius: 6, color: "var(--ink)" }}
          />
          <span className="inline-flex items-center gap-1.5 text-[13px]" style={metaStyle} aria-live="polite" data-testid="save-state">
            <i className="inline-block" style={{ width: 7, height: 7, borderRadius: 999, background: autosave.state === "saving" ? "var(--fg-4)" : autosave.state === "error" ? "var(--danger)" : "var(--signal)" }} />
            {savedText}
            {autosave.state === "error" && program.name.trim() && (
              <LinkBtn className="ml-1.5 text-[13px]" onClick={() => void autosave.flush()}>{C.header.retry}</LinkBtn>
            )}
          </span>
          <span className="hidden lg:block flex-1" />
        </div>

        {autosave.gate && (
          <div className="mx-4 lg:mx-7 mt-3.5">
            <PlanGate gate={autosave.gate} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Plan */}
          <section className="flex-1 min-w-0 flex flex-col gap-3 px-4 py-4 lg:px-7 lg:py-[18px] lg:overflow-y-auto" aria-label={C.plan.label}>
            <div className="text-[13px]" style={metaStyle} data-testid="summary">{summaryLine(program)}</div>
            {phases.map((ph, i) => (
              <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 8 }}>
                {program.split && (
                  <div className="flex justify-between items-center" style={{ padding: "6px 10px" }}>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>{ph.name}</span>
                    <span className="text-[13px]" style={metaStyle}>
                      {C.plan.phaseWeeks(Math.floor(phaseStartDay(program, i) / 7) + 1, weeksOf(phaseStartDay(program, i) + ph.days))}
                    </span>
                  </div>
                )}
                {program.tasks
                  .filter((t) => (program.split ? t.phase === i : true))
                  .map((t) => {
                    const issue = taskIssue(t);
                    // An untitled task asks for its title only once Start was pressed.
                    const showIssue = issue && (tried || (t.key !== sel && issue.kind !== "title"));
                    const n = t.kind === "workout" ? t.exercises.length : 0;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        aria-current={sel === t.key || undefined}
                        onClick={() => {
                          setSel(t.key);
                          setMenuPhase(null);
                        }}
                        className="flex items-center gap-3 w-full text-left hover:bg-bg-2"
                        style={{
                          minHeight: 60,
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: sel === t.key ? "var(--bg-2)" : undefined,
                          boxShadow: sel === t.key ? "inset 3px 0 0 var(--ink)" : undefined,
                        }}
                      >
                        <TaskTile kind={t.kind} tone={taskTone(t)} water={t.kind === "habit" && t.auto === "water"} />
                        <span className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[15px] font-medium truncate" style={{ color: "var(--ink)" }}>{taskLabel(t)}</span>
                          <span className="text-[13px]" style={metaStyle}>
                            {cadenceText(program, t)}
                            {n > 0 ? ` · ${C.plan.exercises(n)}` : ""}
                          </span>
                          {showIssue && <span className="text-[13px]" style={{ color: "var(--danger-ink)" }}>{issue.row}</span>}
                        </span>
                        <span className="text-[13px] tabular-nums" style={metaStyle}>{C.plan.times(count(program, t))}</span>
                      </button>
                    );
                  })}
                <div className="relative" style={{ padding: "4px 6px" }}>
                  <Btn variant="ghost" size="sm" aria-expanded={menuPhase === i} aria-haspopup="menu" onClick={() => setMenuPhase(menuPhase === i ? null : i)}>
                    {C.plan.addTask}
                  </Btn>
                  {menuPhase === i && <AddTaskMenu kinds={kinds} onPick={(k) => addTask(k, i)} onClose={() => setMenuPhase(null)} />}
                </div>
              </div>
            ))}
            {program.tasks.length === 0 && <p className="text-[13px] px-1" style={metaStyle}>{C.plan.empty}</p>}
          </section>

          {/* Inspector, or what the client sees */}
          <aside
            className="flex flex-col gap-4 px-4 py-4 lg:w-[420px] lg:shrink-0 lg:px-[22px] lg:py-[18px] lg:overflow-y-auto"
            style={{ background: "var(--bg)", borderLeft: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}
            aria-label={selected ? TASK_TYPE_COPY[selected.kind].label : C.clientView.eyebrow}
          >
            {selected ? (
              <TaskInspector
                program={program}
                task={selected}
                showIssues={tried}
                onChange={(p) => patchTask(selected.key, p)}
                onRemove={() => removeTask(selected.key)}
                onClose={() => setSel(null)}
              />
            ) : (
              <ClientWeek program={program} week={week} onWeek={setWeek} />
            )}
          </aside>
        </div>
      </div>

    </Shell>
  );
}

/** "+ Add task": six types, each with its tile and one line. */
function AddTaskMenu({ kinds, onPick, onClose }: { kinds: TaskKind[]; onPick: (k: TaskKind) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("[aria-haspopup=menu]")) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      role="menu"
      aria-label={C.plan.addTask}
      className="absolute z-20 flex flex-col"
      style={{ top: 46, left: 6, width: 300, maxWidth: "calc(100vw - 48px)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 12px 32px rgba(11,9,6,.16)", padding: 6 }}
    >
      {kinds.map((k) => (
        <button key={k} type="button" role="menuitem" onClick={() => onPick(k)} className="flex gap-3 items-center text-left hover:bg-bg-2" style={{ padding: "8px 10px", borderRadius: 8 }}>
          <TaskTile kind={k} tone={taskTone({ kind: k, auto: "" })} />
          <span>
            <span className="block font-medium text-[14.5px]" style={{ color: "var(--ink)" }}>{TASK_TYPE_COPY[k].label}</span>
            <span className="block text-[12.5px]" style={metaStyle}>{TASK_TYPE_COPY[k].meta}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

