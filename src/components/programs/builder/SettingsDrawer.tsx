"use client";

import { useEffect, useId, useRef } from "react";
import { BUILDER_COPY } from "./copy";
import { LinkBtn, Seg, Stepper, fieldLabel, fieldLabelStyle, inputStyle } from "./controls";
import { MAX_WEEKS, setSplit, totalWeeks, weeksOf, type BuilderProgram } from "./model";

const C = BUILDER_COPY.settings;
const textarea: React.CSSProperties = { ...inputStyle(), padding: "10px 12px", minHeight: 72, resize: "vertical" };

/**
 * Settings (side drawer): what the coach no longer decides before the first
 * task. Phases (off by default, D2), the late-task window, description and
 * cautions (D4), category (D3), price, Duplicate and Archive.
 */
export function SettingsDrawer({
  program,
  price,
  onChange,
  onPrice,
  onDuplicate,
  onArchive,
  onClose,
}: {
  program: BuilderProgram;
  /** "Free" or the paid summary; null hides Price (e.g. a gym's staff trainer). */
  price: string | null;
  onChange: (next: BuilderProgram) => void;
  onPrice: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onClose: () => void;
}) {
  const aboutId = useId();
  const cautionsId = useId();
  const categoryId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) close.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const p = program;
  const setPhase = (i: number, patch: Partial<BuilderProgram["phases"][number]>) =>
    onChange({ ...p, phases: p.phases.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const removePhase = (i: number) =>
    onChange({
      ...p,
      phases: p.phases.filter((_, j) => j !== i),
      // Its tasks join the phase before (or the next one when it was first).
      tasks: p.tasks.map((t) => (t.phase === i ? { ...t, phase: Math.max(0, i - 1) } : t.phase > i ? { ...t, phase: t.phase - 1 } : t)),
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(11,9,6,0.42)" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={C.title}
        tabIndex={-1}
        className="h-full overflow-y-auto flex flex-col gap-[18px] outline-none"
        style={{ background: "var(--bg)", width: 460, maxWidth: "100%", padding: 22 }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>{C.title}</h3>
          <LinkBtn onClick={onClose}>{C.done}</LinkBtn>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel} style={fieldLabelStyle}>{C.phases}</span>
          <Seg label={C.phases} options={[["0", C.oneBlock], ["1", C.split]] as const} value={p.split ? "1" : "0"} onChange={(v) => onChange(setSplit(p, v === "1"))} />
          {p.split && (
            <>
              {p.phases.map((ph, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input aria-label={C.phaseName(i + 1)} value={ph.name} maxLength={120} onChange={(e) => setPhase(i, { name: e.target.value })} style={inputStyle()} />
                  <Stepper
                    value={weeksOf(ph.days)}
                    text={BUILDER_COPY.create.weeks(weeksOf(ph.days))}
                    min={1}
                    max={MAX_WEEKS}
                    lessLabel={`Less: ${C.phaseLength(ph.name)}`}
                    moreLabel={`More: ${C.phaseLength(ph.name)}`}
                    onChange={(w) => setPhase(i, { days: Math.max(1, Math.min(MAX_WEEKS, w)) * 7 })}
                  />
                  {p.phases.length > 1 && (
                    <button type="button" aria-label={C.removePhase(ph.name)} onClick={() => removePhase(i)} className="text-[13px]" style={{ minWidth: 32, minHeight: 40, color: "var(--fg-3)" }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <LinkBtn
                className="self-start"
                onClick={() => onChange({ ...p, phases: [...p.phases, { name: `Phase ${p.phases.length + 1}`, days: 28 }] })}
                disabled={totalWeeks(p) >= MAX_WEEKS}
              >
                {C.addPhase}
              </LinkBtn>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel} style={fieldLabelStyle}>{C.late}</span>
          <Seg label={C.late} options={C.lateOptions} value={p.catchUp} onChange={(v) => onChange({ ...p, catchUp: v })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={aboutId} className={fieldLabel} style={fieldLabelStyle}>{C.description}</label>
          <textarea id={aboutId} value={p.about} maxLength={2000} onChange={(e) => onChange({ ...p, about: e.target.value })} style={textarea} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={cautionsId} className={fieldLabel} style={fieldLabelStyle}>{C.cautions}</label>
          <textarea id={cautionsId} value={p.cautions} maxLength={2000} onChange={(e) => onChange({ ...p, cautions: e.target.value })} style={textarea} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={categoryId} className={fieldLabel} style={fieldLabelStyle}>{C.category}</label>
          <input id={categoryId} value={p.category} maxLength={80} placeholder={C.categoryPlaceholder} onChange={(e) => onChange({ ...p, category: e.target.value })} style={inputStyle()} />
        </div>

        {price !== null && (
          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel} style={fieldLabelStyle}>{C.price}</span>
            <div className="flex justify-between items-center" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <span className="text-[15px]" style={{ padding: 12, color: "var(--ink)" }}>{price}</span>
              <LinkBtn style={{ padding: 12 }} onClick={onPrice}>{C.change}</LinkBtn>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-3.5" style={{ borderTop: "1px solid var(--border)" }}>
          <LinkBtn onClick={onDuplicate}>{C.duplicate}</LinkBtn>
          <LinkBtn danger onClick={onArchive}>{C.archive}</LinkBtn>
        </div>
      </div>
    </div>
  );
}
