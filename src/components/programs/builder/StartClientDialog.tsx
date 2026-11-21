"use client";

import { useEffect, useId, useState } from "react";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import type { ProgramTemplate } from "@/lib/api/programs";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import { libraryErrorMessage } from "@/lib/exercises/library";
import { PlanGate } from "@/components/ds/PlanGate";
import { BuilderDialog } from "./BuilderDialog";
import { BUILDER_COPY } from "./copy";
import { Btn, Chip, LinkBtn, errStyle, errText, fieldLabel, fieldLabelStyle, inputStyle, metaStyle } from "./controls";
import { startSummary, type BuilderProgram } from "./model";
import { startClient, startDate, type StartChoice } from "./startClient";

const C = BUILDER_COPY.start;
/** Past this many clients the list gets a search box (03 §4, judgement). */
const SEARCH_FROM = 8;

export function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object" && c.client_id !== null) return `${c.client_id.first_name} ${c.client_id.last_name}`.trim();
  return "Client";
}
const firstName = (full: string) => full.split(" ")[0] || full;

export interface Started {
  clientName: string;
  clientProfileId: string;
  /** The client's copy of the program (instance page). */
  instanceId: string;
  /** "today", or the date as the dialog said it ("tomorrow", "next Monday", a date). */
  when: string;
}

/**
 * Start a client: pick the client and the start day, then one button that
 * publishes the latest draft if needed and assigns it (P1-1).
 */
export function StartClientDialog({
  template,
  program,
  beforeStart,
  onClose,
  onStarted,
}: {
  template: ProgramTemplate;
  program: BuilderProgram;
  /** Sends any pending autosave first; false when it couldn't. */
  beforeStart: () => Promise<boolean>;
  onClose: () => void;
  onStarted: (s: Started, template: ProgramTemplate) => void;
}) {
  const dateId = useId();
  const [clients, setClients] = useState<ClientProfile[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<ClientProfile | null>(null);
  const [choice, setChoice] = useState<StartChoice>("today");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<BillingError | null>(null);

  useEffect(() => {
    let live = true;
    void progressService.getMyClientProfiles().then((res) => {
      if (!live) return;
      if (res.success && res.data) setClients(res.data.filter((c) => c.is_active));
      else setLoadError(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const shown = (clients ?? []).filter((c) => clientName(c).toLowerCase().includes(query.trim().toLowerCase()));

  const go = async () => {
    if (!picked || busy) return;
    setBusy(true);
    setError(null);
    setGate(null);
    if (!(await beforeStart())) {
      setBusy(false);
      setError(C.failed);
      return;
    }
    const res = await startClient(template._id, { client_profile_id: picked._id, start_date: startDate(choice, date) });
    setBusy(false);
    if (res.success && res.data) {
      const when =
        choice === "today" ? BUILDER_COPY.done.today : choice === "tomorrow" ? C.tomorrow.toLowerCase() : choice === "monday" ? C.nextMonday.toLowerCase() : `on ${date}`;
      onStarted(
        { clientName: clientName(picked), clientProfileId: picked._id, instanceId: res.data.instance._id, when },
        { ...res.data.template, publish_state: res.data.publish_state },
      );
      return;
    }
    const billing = parseBillingError(res);
    if (billing) setGate(billing);
    else setError(libraryErrorMessage(res) ?? res.message ?? C.failed);
  };

  const starts: ReadonlyArray<readonly [StartChoice, string]> = [
    ["today", C.today],
    ["tomorrow", C.tomorrow],
    ["monday", C.nextMonday],
    ["date", C.pickDate],
  ];

  return (
    <BuilderDialog label={C.title(program.name)} onDismiss={onClose}>
      <h3 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>{C.title(program.name)}</h3>
      <div className="flex flex-col gap-1.5">
        <span className={fieldLabel} style={fieldLabelStyle}>{C.client}</span>
        {loadError ? (
          <span className={errText} style={errStyle}>{C.loadClientsFailed}</span>
        ) : clients !== null && clients.length === 0 ? (
          <span className="text-[13px]" style={metaStyle}>{C.noClients}</span>
        ) : (
          <>
            {(clients?.length ?? 0) > SEARCH_FROM && (
              <input type="search" aria-label={C.client} value={query} onChange={(e) => setQuery(e.target.value)} style={inputStyle()} />
            )}
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto" role="group" aria-label={C.client}>
              {shown.map((c) => {
                const on = picked?._id === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPicked(c)}
                    className="flex justify-between items-center text-left text-[15px]"
                    style={{ minHeight: 48, padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`, color: "var(--ink)" }}
                  >
                    <span>{clientName(c)}</span>
                    {on && <span aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={fieldLabel} style={fieldLabelStyle}>{C.starts}</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label={C.starts}>
          {starts.map(([v, l]) => (
            <Chip key={v} pressed={choice === v} onClick={() => setChoice(v)}>{l}</Chip>
          ))}
        </div>
        {choice === "date" && (
          <input id={dateId} type="date" aria-label={C.dateLabel} value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle(), maxWidth: 220 }} />
        )}
      </div>
      <p className="text-[13px]" style={metaStyle}>{startSummary(program)}</p>
      {gate && <PlanGate gate={gate} />}
      {error && <span role="alert" className={errText} style={errStyle}>{error}</span>}
      <div className="flex flex-col">
        <Btn size="full" softDisabled={!picked} onClick={() => void go()} disabled={busy}>
          {busy ? C.starting : picked ? C.button(firstName(clientName(picked))) : C.buttonIdle}
        </Btn>
        {!picked && <span className="text-[13px] text-center mt-1.5" style={{ color: "var(--fg-2)" }}>{C.pickClient}</span>}
      </div>
      <LinkBtn className="self-center" onClick={onClose}>{C.cancel}</LinkBtn>
    </BuilderDialog>
  );
}
