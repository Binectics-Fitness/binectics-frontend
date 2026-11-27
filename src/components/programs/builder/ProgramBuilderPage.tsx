"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AsyncSpinner } from "@/components/ds";
import { PlanGate } from "@/components/ds/PlanGate";
import { toast } from "@/components/Toast";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { usePaidContentSeller } from "@/hooks/usePaidContentSeller";
import { ContentPricingModal } from "@/components/content/ContentPricingModal";
import { accessToRaw, normalizeAccess } from "@/lib/api/paidContent";
import { accessSummary, isPaid } from "@/lib/paidContent/helpers";
import { libraryErrorMessage } from "@/lib/exercises/library";
import { parseBillingError } from "@/lib/utils/billingErrors";
import { programsService, type ProgramInstance, type ProgramTemplate } from "@/lib/api/programs";
import type { ProgramsRoleConfig } from "../config";
import { BUILDER_COPY, TASK_TYPE_COPY, UPDATE_COPY } from "./copy";
import { Btn, LinkBtn, TaskTile, metaStyle } from "./controls";
import { ClientWeek } from "./ClientWeek";
import { TaskInspector } from "./TaskInspector";
import { TaskTypeFields } from "./TaskTypeFields";
import { NewContentSheet } from "./NewContentSheet";
import { useContentOptions } from "./useContentOptions";
import { SettingsDrawer } from "./SettingsDrawer";
import { StartClientDialog, type Started } from "./StartClientDialog";
import { UpdateClientsDialog } from "./UpdateClientsDialog";
import { draftAhead } from "./startClient";
import { useAutosave } from "./useAutosave";
import {
  TASK_KINDS,
  cadenceText,
  count,
  fromVersion,
  newTask,
  phaseStartDay,
  startBlocker,
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

function instanceName(i: ProgramInstance): string | null {
  if (i.client_name?.trim()) return i.client_name.trim();
  if (typeof i.client_id === "object" && i.client_id) return `${i.client_id.first_name} ${i.client_id.last_name}`.trim();
  return null;
}

/**
 * The program page (P2-1): the plan on the left; on the right the selected
 * task, or "What your client sees" when nothing is selected. Every change
 * saves itself (P2-3). "Start a client" is the one finishing action (P1-1).
 */
export default function ProgramBuilderPage({ config, id }: { config: ProgramsRoleConfig; id: string }) {
  const { Shell, basePath, navItem } = config;
  const router = useRouter();
  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [program, setProgram] = useState<BuilderProgram | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [menuPhase, setMenuPhase] = useState<number | null>(null);
  const [week, setWeek] = useState(1);
  /** "Start a client" was pressed while something was unfinished: every problem shows. */
  const [tried, setTried] = useState(false);
  const [settings, setSettings] = useState(false);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState<Started | null>(null);
  const [pricing, setPricing] = useState(false);
  const [onProgram, setOnProgram] = useState<string[]>([]);
  /** Clients on a version older than the latest published one (U3). */
  const [behind, setBehind] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [sheet, setSheet] = useState<"form" | "meal" | null>(null);
  const [publishing, setPublishing] = useState(false);
  const sheetBefore = useRef<{ kind: "form" | "meal"; ids: Set<string>; taskKey: string } | null>(null);
  const { forms, mealPlans, reload } = useContentOptions(config.mealPlans);
  const { on: sellingOn, canPrice } = usePaidContentSeller();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const autosave = useAutosave(id, (detail) => setTemplate({ ...detail.template, publish_state: detail.publish_state ?? detail.template.publish_state }));

  const loadAssignments = useCallback(
    (isLive: () => boolean = () => true) =>
      programsService.listAssignments(id).then((res) => {
        if (!isLive() || !res.success || !res.data) return;
        const live_ = res.data.filter((i) => i.status === "active" || i.status === "assigned" || i.status === "paused");
        setOnProgram(live_.map(instanceName).filter((n): n is string => !!n));
        setBehind(live_.filter((i) => i.on_older_version).map(instanceName).filter((n): n is string => !!n));
      }),
    [id],
  );

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
    void loadAssignments(() => live);
    return () => {
      live = false;
    };
  }, [id, loadAssignments]);

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
    const t = newTask(kind, { phase, existing: program.tasks, forms });
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

  // "+ New form / + New meal plan": remember what existed, pick what's new on close.
  const openSheet = (kind: "form" | "meal") => {
    if (!sel) return;
    sheetBefore.current = { kind, ids: new Set((kind === "form" ? forms : mealPlans).map((o) => o.id)), taskKey: sel };
    setSheet(kind);
  };
  const closeSheet = async () => {
    setSheet(null);
    const before = sheetBefore.current;
    sheetBefore.current = null;
    const lists = await reload();
    if (!before) return;
    const made = (before.kind === "form" ? lists.forms : lists.mealPlans).find((o) => !before.ids.has(o.id));
    if (made) {
      patchTask(before.taskKey, before.kind === "form" ? { form_id: made.id, contentTitle: made.title } : { meal_plan_id: made.id, contentTitle: made.title });
    }
  };

  const pressStart = () => {
    if (!program) return;
    if (blocker) {
      setTried(true);
      const first = program.tasks.find((t) => taskIssue(t));
      if (first) setSel(first.key);
      else if (!program.tasks.length) setMenuPhase(0);
      return;
    }
    setStarting(true);
  };

  const publishChanges = async () => {
    if (!template) return;
    setPublishing(true);
    await autosave.flush();
    const res = await programsService.publishTemplate(template._id);
    setPublishing(false);
    if (res.success && res.data) {
      setTemplate({ ...res.data.template, publish_state: res.data.publish_state ?? res.data.template.publish_state });
      toast.success(C.header.published);
    } else if (!parseBillingError(res)) {
      toast.error(libraryErrorMessage(res) ?? res.message ?? C.loadFailed);
    }
  };

  const duplicate = async () => {
    await autosave.flush();
    const res = await programsService.duplicateTemplate(id);
    if (res.success && res.data) {
      toast.success(C.settings.duplicated);
      setSettings(false);
      router.push(`${basePath}/${res.data.template._id}`);
    } else {
      toast.error(res.message ?? C.loadFailed);
    }
  };

  const archive = () => {
    if (!program) return;
    requestConfirmation({
      title: C.settings.archiveTitle(program.name),
      description: C.settings.archiveBody,
      confirmLabel: C.settings.archiveConfirm,
      confirmVariant: "danger",
      onConfirm: async () => {
        await autosave.flush();
        const res = await programsService.archiveTemplate(id);
        if (res.success) router.push(basePath);
        else toast.error(res.message ?? C.loadFailed);
      },
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
  const access = normalizeAccess(template.access);
  // D1: sold or listed programs keep a visible publish step; others publish on Start.
  const sold = template.publish_state?.sold_or_listed ?? isPaid(access);
  const showPublish = template.publish_state ? template.publish_state.needs_publish : sold && draftAhead(template);
  const blocker = startBlocker(program) ?? (showPublish ? C.startBlocked.publishFirst : null);
  const savedText =
    autosave.state === "saving" ? C.header.saving : autosave.state === "error" ? C.header.notSaved : template.latest_published_version_no >= 1 && !draftAhead(template) ? C.header.saved : C.header.draftSaved;
  const phases = program.split ? program.phases : [program.phases[0]];
  const kinds = TASK_KINDS.filter((k) => k !== "meal" || config.mealPlans);
  const priceText = canPrice && (sellingOn || sold) ? (sold ? accessSummary(access) : C.settings.free) : null;

  if (started) {
    const first = started.clientName.split(" ")[0];
    return (
      <Shell activeItem={navItem} crumb={navItem}>
        <div className="flex-1 flex flex-col items-center justify-center gap-3.5 text-center p-8" style={{ minHeight: "60vh" }}>
          <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, background: "var(--signal-soft)", color: "var(--signal-ink)" }} aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
          </div>
          <h2 className="text-[22px] font-medium" style={{ color: "var(--ink)" }}>{C.done.title(first, started.when)}</h2>
          <p className="max-w-[360px]" style={{ color: "var(--fg-2)" }}>{C.done.body(program.name)}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Btn onClick={() => router.push(`${basePath}/instances/${started.instanceId}`)}>{C.done.seePlan(first)}</Btn>
            <Btn variant="ghost" onClick={() => { setStarted(null); setSel(null); }}>{C.done.back}</Btn>
          </div>
        </div>
      </Shell>
    );
  }

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
          <div className="flex items-start gap-2 w-full lg:w-auto">
            {showPublish && (
              <Btn variant="ghost" size="sm" disabled={publishing} onClick={() => void publishChanges()}>
                {publishing ? C.header.publishing : C.header.publishChanges}
              </Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => setSettings(true)}>{C.header.settings}</Btn>
            <div className="flex flex-col items-end ml-auto lg:ml-0">
              <Btn size="sm" softDisabled={!!blocker} onClick={pressStart}>{C.header.startClient}</Btn>
              {blocker && <span className="text-[13px] mt-[3px]" style={metaStyle}>{blocker}</span>}
            </div>
          </div>
        </div>

        {onProgram.length > 0 && (
          <div className="mx-4 lg:mx-7 mt-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[13.5px]" style={{ background: "var(--bg-3)", borderRadius: 8, padding: "10px 12px", color: "var(--fg-2)" }}>
            <span>{behind.length > 0 ? UPDATE_COPY.banner(behind) : C.banner(onProgram)}</span>
            {behind.length > 0 && (
              <Btn variant="ghost" size="sm" onClick={() => setUpdating(true)}>{UPDATE_COPY.button}</Btn>
            )}
          </div>
        )}
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
                typeFields={
                  <TaskTypeFields
                    task={selected}
                    showIssues={tried}
                    forms={forms}
                    mealPlans={mealPlans}
                    onChange={(p) => patchTask(selected.key, p)}
                    onNewContent={openSheet}
                  />
                }
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

      <NewContentSheet kind={sheet} onClose={() => void closeSheet()} />
      {settings && (
        <SettingsDrawer
          program={program}
          price={priceText}
          onChange={edit}
          onPrice={() => setPricing(true)}
          onDuplicate={() => void duplicate()}
          onArchive={archive}
          onClose={() => setSettings(false)}
        />
      )}
      {pricing && (
        <ContentPricingModal
          open
          onClose={() => setPricing(false)}
          kind="program"
          itemId={template._id}
          title={program.name}
          rawAccess={template.access}
          needsPublish={template.latest_published_version_no < 1}
          onSaved={(a) => setTemplate((t) => (t ? { ...t, access: accessToRaw(a) } : t))}
        />
      )}
      {starting && (
        <StartClientDialog
          template={template}
          program={program}
          beforeStart={autosave.flush}
          onClose={() => setStarting(false)}
          onStarted={(s, t) => {
            setStarting(false);
            setTemplate(t);
            setOnProgram((cur) => [...cur, s.clientName]);
            setStarted(s);
          }}
        />
      )}
      {updating && template && (
        <UpdateClientsDialog
          templateId={template._id}
          programName={program.name}
          publishLatest={!sold}
          beforeApply={autosave.flush}
          onClose={() => setUpdating(false)}
          onApplied={() => {
            void loadAssignments();
            void programsService.getTemplate(id).then((res) => {
              if (res.success && res.data) setTemplate({ ...res.data.template, publish_state: res.data.publish_state ?? res.data.template.publish_state });
            });
          }}
        />
      )}
      {confirmationModal}
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

