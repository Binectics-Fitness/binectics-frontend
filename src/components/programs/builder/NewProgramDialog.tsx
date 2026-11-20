"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { programsService, type ProgramTemplate } from "@/lib/api/programs";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import { PlanGate } from "@/components/ds/PlanGate";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { BuilderDialog } from "./BuilderDialog";
import { BUILDER_COPY } from "./copy";
import { Btn, Chip, Seg, Stepper, errStyle, errText, fieldLabel, fieldLabelStyle, inputStyle } from "./controls";
import { DEFAULT_WEEKS, MAX_WEEKS, createPayload, fromVersion, setWeeks, toPayload } from "./model";

const C = BUILDER_COPY.create;
/** How many of the coach's own programs "Start from" offers (D7: own programs only). */
const MAX_COPIES = 3;

/**
 * New program: Name, Length, Start from. Create makes the draft (or a copy of
 * one of the coach's own programs) and opens its page.
 */
export function NewProgramDialog({
  programs,
  basePath,
  onClose,
}: {
  /** The coach's programs, newest first; live ones are offered as a copy. */
  programs: ProgramTemplate[];
  basePath: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const nameId = useId();
  const errId = useId();
  const [name, setName] = useState("");
  const [weeks, setWeeksState] = useState(DEFAULT_WEEKS);
  const [from, setFrom] = useState<string>("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gate, setGate] = useState<BillingError | null>(null);
  const { requestClose, dirtyProps, confirmationModal } = useUnsavedChangesGuard(onClose);
  const copies = programs.filter((p) => p.status !== "archived").slice(0, MAX_COPIES);
  const nameError = tried && !name.trim();

  const create = async () => {
    setTried(true);
    if (!name.trim() || busy) return;
    setBusy(true);
    setFailed(false);
    setGate(null);
    let id: string | null = null;
    let refusal: Parameters<typeof parseBillingError>[0] | null = null;
    if (from) {
      // P3-4: wrap the existing Duplicate, then give the copy this name and length.
      const dup = await programsService.duplicateTemplate(from);
      if (dup.success && dup.data) {
        const copy = fromVersion(dup.data.version);
        const named = copy.split ? { ...copy, name: name.trim() } : { ...setWeeks(copy, weeks), name: name.trim() };
        const res = await programsService.updateTemplate(dup.data.template._id, toPayload(named));
        id = dup.data.template._id;
        if (!res.success) refusal = res;
      } else {
        refusal = dup;
      }
    } else {
      const res = await programsService.createTemplate(createPayload(name, weeks));
      if (res.success && res.data) id = res.data.template._id;
      else refusal = res;
    }
    if (id) {
      router.push(`${basePath}/${id}`);
      return;
    }
    setBusy(false);
    const billing = refusal ? parseBillingError(refusal) : null;
    if (billing) setGate(billing);
    else setFailed(true);
  };

  return (
    <BuilderDialog label={C.title} onDismiss={requestClose} panelProps={dirtyProps}>
      {confirmationModal}
      <h3 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>{C.title}</h3>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className={fieldLabel} style={fieldLabelStyle}>{C.nameLabel}</label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={C.namePlaceholder}
            maxLength={160}
            aria-invalid={nameError || undefined}
            aria-describedby={nameError ? errId : undefined}
            style={inputStyle(nameError)}
          />
          {nameError && <span id={errId} className={errText} style={errStyle}>{C.nameError}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel} style={fieldLabelStyle}>{C.lengthLabel}</span>
          <div className="flex flex-wrap items-center gap-2.5">
            <Seg
              label={C.lengthLabel}
              options={[4, 8, 12].map((n) => [n, C.weeks(n)] as const)}
              value={weeks}
              onChange={setWeeksState}
            />
            <Stepper
              value={weeks}
              text={C.weeks(weeks)}
              min={1}
              max={MAX_WEEKS}
              lessLabel={C.lessWeeks}
              moreLabel={C.moreWeeks}
              onChange={(v) => setWeeksState(Math.max(1, Math.min(MAX_WEEKS, v)))}
            />
          </div>
        </div>
        {copies.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel} style={fieldLabelStyle}>{C.startFrom}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={C.startFrom}>
              <Chip pressed={from === ""} onClick={() => setFrom("")}>{C.blank}</Chip>
              {copies.map((p) => (
                <Chip key={p._id} pressed={from === p._id} onClick={() => setFrom(p._id)}>
                  {C.copyOf(p.name)}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {gate && <PlanGate gate={gate} />}
        {failed && <span role="alert" className={errText} style={errStyle}>{C.failed}</span>}
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={requestClose}>{C.cancel}</Btn>
          <Btn type="submit" disabled={busy}>{busy ? C.submitting : C.submit}</Btn>
        </div>
      </form>
    </BuilderDialog>
  );
}
