"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/Toast";
import { AsyncSpinner } from "@/components/ds";
import { PlanGate } from "@/components/ds/PlanGate";
import { BuilderDialog } from "@/components/programs/builder/BuilderDialog";
import { Btn, Chip, LinkBtn, errStyle, errText, fieldLabel, fieldLabelStyle, metaStyle } from "@/components/programs/builder/controls";
import { programsService, type ProgramPublishState, type ProgramTemplate, type StartClientResult } from "@/lib/api/programs";
import { paidContentErrorOf, paidContentService, type ContentOffer } from "@/lib/api/paidContent";
import { paidContentCopy, pricesText } from "@/lib/paidContent/helpers";
import { libraryErrorMessage } from "@/lib/exercises/library";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import type { ApiResponse } from "@/lib/types";

/**
 * Start a client on a program from the client's page (mobile
 * CoachAssignProgramScreen, #279). Pick the program, pick the start day,
 * Start program.
 *
 * Start works like the builder's "Start a client": one call with
 * publish_latest, so the program's latest draft is published and assigned
 * together (api #361), and drafts are listed too. A sold or listed program
 * with unpublished edits (publish_state.needs_publish) can't be started until
 * the coach publishes them: "Publish changes" (owner D1). If it became sold
 * since the list loaded, the API refuses with 409 PROGRAM_UNPUBLISHED_CHANGES
 * and the dialog shows the same button.
 *
 * Shared by the trainer and dietitian client pages: `programsPath` is the
 * role's programs list.
 */

export const START_PROGRAM_COPY = {
  title: (name: string) => `Program for ${name}`,
  program: "Program",
  starts: "Starts",
  today: "Today",
  tomorrow: "Tomorrow",
  nextMonday: "Next Monday",
  help: (name: string) => `${name} gets the program's tasks on their Today from the start day.`,
  start: "Start program",
  starting: "Starting…",
  cancel: "Cancel",
  started: (name: string) => `Program started for ${name}`,
  loading: "Loading programs",
  loadFailed: "Couldn't load your programs.",
  retry: "Try again",
  failed: "Couldn't start the program. Try again.",
  none: "You have no programs with tasks yet. Create one and it will be here to start.",
  create: "Create a program",
  seeAll: "See your programs",
  publishChanges: "Publish changes",
  publishing: "Publishing…",
  publishNote: "Buyers get the version you last published.",
  published: "Changes published.",
  publishFailed: "Couldn't publish. Try again.",
  needsTitle: (name: string) => `${name} doesn't have this yet.`,
  needsBody: "They can pay for it, or you can give it to them for free.",
  askToPay: (name: string) => `Ask ${name} to pay`,
  asked: (name: string) => `We've let ${name} know. They can pay from the app.`,
  askedToast: (name: string) => `Asked ${name} to pay`,
  give: "Give for free",
  given: (name: string) => `Given to ${name} for free`,
  askFailed: "Couldn't send that. Try again.",
  giveFailed: "Couldn't give it. Try again.",
} as const;

const C = START_PROGRAM_COPY;

/** YYYY-MM-DD in the coach's local calendar. */
function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Today, tomorrow and the coming Monday (dropped when that is tomorrow), as local days. */
export function startOptions(from: Date = new Date()): { label: string; date: string }[] {
  const day = (n: number) => ymd(new Date(from.getFullYear(), from.getMonth(), from.getDate() + n));
  const toMonday = (8 - from.getDay()) % 7 || 7;
  return [
    { label: C.today, date: day(0) },
    { label: C.tomorrow, date: day(1) },
    ...(toMonday > 1 ? [{ label: C.nextMonday, date: day(toMonday) }] : []),
  ];
}

/**
 * Programs a client can be started on: not archived, with at least one task.
 * A list row without task_count falls back to programs published at least once.
 */
export function startablePrograms(rows: ProgramTemplate[]): ProgramTemplate[] {
  return rows.filter(
    (t) => t.status !== "archived" && (typeof t.task_count === "number" ? t.task_count > 0 : t.latest_published_version_no > 0),
  );
}

/** A sold or listed program with unpublished edits: publish them first (D1). */
export const needsPublish = (t: Pick<ProgramTemplate, "publish_state"> | null | undefined): boolean => !!t?.publish_state?.needs_publish;

/** 409 PROGRAM_UNPUBLISHED_CHANGES: publish_latest was refused and nothing was written. */
export const isUnpublishedChangesRefusal = (res: Pick<ApiResponse<unknown>, "status" | "code">): boolean =>
  res.status === 409 && res.code === "PROGRAM_UNPUBLISHED_CHANGES";

function offerSentence(offer: ContentOffer | null): string {
  if (!offer) return C.needsBody;
  const price = offer.prices.length > 0 ? `It's ${pricesText(offer.prices)}` : null;
  const plans = offer.plans.length > 0 ? `included in ${offer.plans.map((p) => p.name).join(", ")}` : null;
  if (price && plans) return `${price}, or ${plans}.`;
  if (price) return `${price}.`;
  if (plans) return `It's ${plans}.`;
  return C.needsBody;
}

export function StartProgramDialog({
  clientProfileId,
  clientName,
  programsPath,
  onClose,
  onStarted,
}: {
  clientProfileId: string;
  /** First name, as the dialog addresses the client. */
  clientName: string;
  /** The role's programs list, e.g. /dashboard/trainer/programs. */
  programsPath: string;
  onClose: () => void;
  onStarted: (result: StartClientResult) => void;
}) {
  const starts = useMemo(() => startOptions(), []);
  const [programs, setPrograms] = useState<ProgramTemplate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [start, setStart] = useState(starts[0].date);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<BillingError | null>(null);
  // The client doesn't have this paid program yet (403 CONTENT_ENTITLEMENT_REQUIRED).
  const [needs, setNeeds] = useState<{ programId: string; offer: ContentOffer | null } | null>(null);

  const apply = useCallback((res: Awaited<ReturnType<typeof programsService.listTemplates>>) => {
    if (res.success && Array.isArray(res.data)) {
      const list = startablePrograms(res.data);
      setPrograms(list);
      if (list.length === 1) setPicked(list[0]._id);
    } else {
      setLoadError(res.message || C.loadFailed);
      setPrograms([]);
    }
  }, []);

  useEffect(() => {
    let live = true;
    void programsService.listTemplates().then((res) => {
      if (live) apply(res);
    });
    return () => {
      live = false;
    };
  }, [apply]);

  const load = async () => {
    setLoadError(null);
    setPrograms(null);
    apply(await programsService.listTemplates());
  };

  const program = programs?.find((p) => p._id === picked) ?? null;
  const blocked = needsPublish(program);

  const setPublishState = (id: string, publish_state: ProgramPublishState | undefined) =>
    setPrograms((list) => list?.map((p) => (p._id === id ? { ...p, publish_state } : p)) ?? list);

  const publishChanges = async () => {
    if (!program) return;
    setPublishing(true);
    setError(null);
    const res = await programsService.publishTemplate(program._id);
    setPublishing(false);
    if (res.success && res.data) {
      const state = res.data.publish_state ?? res.data.template.publish_state;
      setPublishState(program._id, state ?? (program.publish_state && { ...program.publish_state, needs_publish: false, has_unpublished_changes: false }));
      toast.success(C.published);
    } else {
      setError(libraryErrorMessage(res) ?? (res.message || C.publishFailed));
    }
  };

  const go = async () => {
    if (!program || blocked || busy) return;
    setBusy(true);
    setError(null);
    setGate(null);
    setNeeds(null);
    const res = await programsService.startClient(program._id, {
      client_profile_id: clientProfileId,
      start_date: start,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    if (res.success && res.data) {
      toast.success(C.started(clientName));
      onStarted(res.data);
      return;
    }
    setBusy(false);
    const refusal = paidContentErrorOf(res);
    const billing = parseBillingError(res);
    if (refusal?.code === "CONTENT_ENTITLEMENT_REQUIRED") {
      setNeeds({ programId: program._id, offer: refusal.offer });
    } else if (refusal) {
      setError(paidContentCopy(refusal));
    } else if (isUnpublishedChangesRefusal(res)) {
      // Sold or listed since the list loaded: show Publish changes.
      setPublishState(program._id, {
        sold_or_listed: true,
        published_version_no: program.publish_state?.published_version_no ?? program.latest_published_version_no,
        has_unpublished_changes: true,
        needs_publish: true,
      });
    } else if (billing) {
      setGate(billing);
    } else {
      setError(libraryErrorMessage(res) ?? (res.message || C.failed));
    }
  };

  const title = C.title(clientName);

  let body;
  if (programs === null) {
    body = <AsyncSpinner label={C.loading} />;
  } else if (programs.length === 0) {
    body = loadError ? (
      <div className="flex flex-col gap-3 items-start">
        <span role="alert" className={errText} style={errStyle}>{loadError}</span>
        <Btn variant="ghost" onClick={() => void load()}>{C.retry}</Btn>
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>{C.none}</p>
        <Link href={`${programsPath}?new=1`} className="btn-primary-v2" style={{ height: 44 }}>{C.create}</Link>
        <Link href={programsPath} className="btn-ghost-v2" style={{ height: 44 }}>{C.seeAll}</Link>
      </div>
    );
  } else {
    body = (
      <>
        <fieldset className="flex flex-col gap-1.5 min-w-0">
          <legend className={`${fieldLabel} mb-1.5`} style={fieldLabelStyle}>{C.program}</legend>
          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
            {programs.map((p) => {
              const on = p._id === picked;
              return (
                <label
                  key={p._id}
                  className="flex items-center gap-3 cursor-pointer text-[15px] focus-within:outline-2 focus-within:outline-offset-2"
                  style={{ minHeight: 48, padding: "10px 14px", background: "var(--bg)", borderRadius: 10, border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`, color: "var(--ink)", outlineColor: "var(--ink)" }}
                >
                  <input
                    type="radio"
                    name="start-program"
                    value={p._id}
                    checked={on}
                    onChange={() => {
                      setPicked(p._id);
                      setNeeds(null);
                      setError(null);
                    }}
                    className="sr-only"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{p.name}</span>
                    {p.category && <span className="block text-[13px]" style={metaStyle}>{p.category}</span>}
                  </span>
                  {on && <span aria-hidden="true">✓</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel} style={fieldLabelStyle}>{C.starts}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={C.starts}>
            {starts.map((s) => (
              <Chip key={s.date} pressed={start === s.date} onClick={() => setStart(s.date)} style={{ minHeight: 44 }}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
        <p className="text-[13px]" style={metaStyle}>{C.help(clientName)}</p>
        {blocked && (
          <div className="flex items-center gap-3" data-testid="start-publish-changes">
            <p className="flex-1 text-[13px]" style={{ color: "var(--fg-2)" }}>{C.publishNote}</p>
            <Btn variant="ghost" onClick={() => void publishChanges()} disabled={publishing || busy}>
              {publishing ? C.publishing : C.publishChanges}
            </Btn>
          </div>
        )}
        {gate && <PlanGate gate={gate} />}
        {error && <span role="alert" className={errText} style={errStyle}>{error}</span>}
        {needs && (
          <NeedsAccess
            programId={needs.programId}
            offer={needs.offer}
            clientProfileId={clientProfileId}
            clientName={clientName}
            onGranted={() => void go()}
          />
        )}
        <Btn size="full" onClick={() => void go()} disabled={!program || busy || publishing || blocked}>
          {busy ? C.starting : C.start}
        </Btn>
      </>
    );
  }

  return (
    <BuilderDialog label={title} onDismiss={onClose}>
      <h2 className="text-[20px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>{title}</h2>
      {body}
      <LinkBtn className="self-center" style={{ minHeight: 44 }} onClick={onClose}>{C.cancel}</LinkBtn>
    </BuilderDialog>
  );
}

/**
 * The client doesn't have this paid program: ask them to pay (a notice to
 * them), or give it for free and start again. Both are the coach's choice.
 */
function NeedsAccess({
  programId,
  offer,
  clientProfileId,
  clientName,
  onGranted,
}: {
  programId: string;
  offer: ContentOffer | null;
  clientProfileId: string;
  clientName: string;
  onGranted: () => void;
}) {
  const [busy, setBusy] = useState<"ask" | "give" | null>(null);
  const [asked, setAsked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setBusy("ask");
    setError(null);
    const res = await paidContentService.askToPay("program", programId, clientProfileId);
    setBusy(null);
    if (res.success && res.data?.alreadyHasAccess) {
      onGranted();
    } else if (res.success) {
      setAsked(true);
      toast.success(C.askedToast(clientName));
    } else {
      const refusal = paidContentErrorOf(res);
      setError(refusal ? paidContentCopy(refusal) : (res.message || C.askFailed));
    }
  };

  const give = async () => {
    setBusy("give");
    setError(null);
    const res = await paidContentService.grant("program", programId, clientProfileId);
    setBusy(null);
    if (res.success) {
      toast.success(C.given(clientName));
      onGranted();
    } else {
      const refusal = paidContentErrorOf(res);
      setError(refusal ? paidContentCopy(refusal) : (res.message || C.giveFailed));
    }
  };

  return (
    <div role="alert" className="flex flex-col gap-1 rounded-(--r-2) p-3.5" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}>
      <p className="text-[14px] font-medium">{C.needsTitle(clientName)}</p>
      <p className="text-[13px]">{offerSentence(offer)}</p>
      {asked && <p className="text-[13px]">{C.asked(clientName)}</p>}
      {error && <p className="text-[13px]" style={errStyle}>{error}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        <Btn variant="ghost" onClick={() => void ask()} disabled={!!busy}>{C.askToPay(clientName)}</Btn>
        <Btn onClick={() => void give()} disabled={!!busy}>{C.give}</Btn>
      </div>
    </div>
  );
}
