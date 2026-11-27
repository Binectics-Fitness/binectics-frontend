"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DSCard, Eyebrow, StatusPill } from "@/components/ds";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { toast } from "@/components/Toast";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, ClientJournalEntry, WeightLog } from "@/lib/api/progress";
import { programsService, type ClientProgramSummary } from "@/lib/api/programs";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { useOnline } from "@/hooks/useOnline";
import OneOffTasksCard from "@/components/programs/OneOffTasksCard";
import ProgramResultsSection from "@/components/programs/results/ProgramResultsSection";
import { SessionLogsSection } from "@/components/coachSessions/SessionLogsSection";
import { ClientReportsCard } from "@/components/progress-reports/ClientReportsCard";
import { TRAINER_PROGRAMS_CONFIG } from "@/components/programs/config";
import { StartProgramDialog } from "@/components/clients/StartProgramDialog";
import { LogWeightForm, LOG_WEIGHT_COPY } from "@/components/clients/LogWeightForm";
import { CLIENT_PAGE_COPY as C, SESSION_LABEL } from "./copy";

/**
 * A client, for the trainer at their desk (board:
 * binectics-plans/design/coach-client-page, frames D1-D7, M1-M2). In the
 * owner's order (20 Nov 2026): when I see them next and this week, what they
 * did on their programs with the note beside it, the record, and body
 * measurements last. Everything shown is real.
 */

interface ClientPageData {
  profile: ClientProfile;
  journals: ClientJournalEntry[];
  weights: WeightLog[];
  programs: ClientProgramSummary[];
  bookings: ConsultationBooking[];
}

/** Read everything the page shows. Only the profile is required; the rest degrade to empty. */
async function loadClient(clientId: string): Promise<ClientPageData> {
  const [p, j, w, o, b] = await Promise.allSettled([
    progressService.getClientProfile(clientId),
    progressService.getClientJournalEntries(clientId, 20),
    progressService.getWeightLogs(clientId, 5),
    programsService.getClientOverview(clientId),
    consultationsService.getProviderBookings(),
  ]);
  if (p.status !== "fulfilled" || !p.value.success || !p.value.data) throw new Error(C.errorTitle);
  return {
    profile: p.value.data,
    journals: j.status === "fulfilled" && j.value.success ? (j.value.data ?? []) : [],
    weights: w.status === "fulfilled" && w.value.success ? (w.value.data ?? []) : [],
    programs: o.status === "fulfilled" && o.value.success ? (o.value.data?.programs ?? []) : [],
    bookings: b.status === "fulfilled" && b.value.success ? (b.value.data ?? []) : [],
  };
}

const clientPageKey = (clientId: string) => ["coach-client-page", clientId] as const;

function clientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object") {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`.trim();
  }
  return "Client";
}

function clientUserId(profile: ClientProfile): string | null {
  return typeof profile.client_id === "object" ? profile.client_id._id : profile.client_id || null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

const LOG_WEIGHT_LABEL = LOG_WEIGHT_COPY.open;
const h2 = "text-[15px] font-medium";
const ink = { color: "var(--ink)" } as const;
const muted = { color: "var(--fg-3)" } as const;

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId;
  const online = useOnline();
  const query = useQuery({
    queryKey: clientPageKey(clientId ?? ""),
    queryFn: () => loadClient(clientId!),
    enabled: !!clientId,
    // A coach coming back to the tab, or back online, sees fresh results; a
    // failed refresh keeps the page and says when it was loaded.
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const data = query.data;

  let body: ReactNode;
  if (data) {
    const banner = !online
      ? C.offline(timeLabel(query.dataUpdatedAt))
      : query.isError
        ? C.refreshFailed(timeLabel(query.dataUpdatedAt))
        : null;
    body = <ClientPage clientId={clientId!} data={data} banner={banner} onRetry={() => void query.refetch()} />;
  } else if (query.isError || (!online && !query.isFetching)) {
    body = (
      <DSCard className="px-5.5 py-5">
        <div role="alert">
          <p className="text-[15px] font-medium" style={ink}>{online ? C.errorTitle : C.offlineNoSaved}</p>
          {online && <p className="mt-1 text-[14px]" style={muted}>{C.errorBody}</p>}
          <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void query.refetch()}>
            {C.retry}
          </button>
        </div>
      </DSCard>
    );
  } else {
    body = <PageSkeleton />;
  }

  return (
    <TrainerDashboardShell activeItem="Clients" crumb={data ? clientName(data.profile) : "Client"}>
      {body}
    </TrainerDashboardShell>
  );
}

/** Loading: the page's own layout in grey (board D2/M2). */
function PageSkeleton() {
  const block = (style: CSSProperties) => <div className="rounded-(--r-1)" style={{ background: "var(--bg-3)", ...style }} />;
  const card = (height: number) => <div className="rounded-(--r-3)" style={{ background: "var(--bg-3)", height }} />;
  return (
    <div role="status" aria-label={C.loading} className="contents">
      <div className="flex items-start gap-4" aria-hidden="true">
        <div className="w-18 h-18 rounded-full shrink-0" style={{ background: "var(--bg-3)" }} />
        <div className="flex flex-col gap-2.5 pt-2">
          {block({ width: 180, height: 26 })}
          {block({ width: 220, height: 14 })}
          {block({ width: 160, height: 14 })}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-hidden="true">
        {card(92)}
        {card(92)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start" aria-hidden="true">
        <div className="flex flex-col gap-4">
          {block({ width: 140, height: 18 })}
          {card(360)}
        </div>
        <div className="flex flex-col gap-4">
          {card(150)}
          {card(110)}
        </div>
      </div>
    </div>
  );
}

function ClientPage({
  clientId,
  data,
  banner,
  onRetry,
}: {
  clientId: string;
  data: ClientPageData;
  banner: string | null;
  onRetry: () => void;
}) {
  const { profile, journals, weights, programs, bookings } = data;
  const { fmtDate, fmtDateTime } = useOrgFormat();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [allNotes, setAllNotes] = useState(false);
  const [trend, setTrend] = useState(false);
  const [starting, setStarting] = useState(false);
  const [logging, setLogging] = useState(false);
  // "Now" for splitting next from past sessions, fixed when the page opens.
  const [now] = useState(() => Date.now());

  const name = clientName(profile);
  const firstName = name.split(" ")[0];
  const userId = clientUserId(profile);
  const livePrograms = programs.filter((p) => p.kind === "program" && (p.status === "active" || p.status === "paused"));
  const lead = livePrograms[0];
  const week = lead?.progress?.last_7_days;
  const latestWeight = weights[0];

  const next = useMemo(() => {
    const upcoming = bookings
      .filter((b) => b.clientUserId === userId && (b.status === "CONFIRMED" || b.status === "PENDING") && Date.parse(b.endsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return upcoming[0] ?? null;
  }, [bookings, userId, now]);

  const saveNote = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await progressService.createClientJournalEntry(clientId, { notes: draft.trim() });
    setSaving(false);
    if (res.success && res.data) {
      const entry = res.data;
      queryClient.setQueryData<ClientPageData>(clientPageKey(clientId), (d) => (d ? { ...d, journals: [entry, ...d.journals] } : d));
      setDraft("");
      toast.success(C.noteSaved);
    } else {
      toast.error(res.message ?? C.noteFailed);
    }
  };

  const nextSub = next
    ? [next.consultationTypeName, SESSION_LABEL[next.status]?.toLowerCase()].filter(Boolean).join(" · ")
    : C.noneBooked;
  const weekSub = lead
    ? [lead.name, week && week.missed > 0 ? C.missed(week.missed) : null].filter(Boolean).join(" · ")
    : C.notOnProgram;
  const shownNotes = allNotes ? journals : journals.slice(0, 1);
  const active = profile.is_active;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
        <div className="flex items-start gap-4">
          <span className="w-18 h-18 rounded-full flex items-center justify-center text-[18px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
            {initials(name)}
          </span>
          <div>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", ...ink }}>{name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <StatusPill tone={profile.is_active ? "success" : "neutral"} label={profile.is_active ? C.activeClient : C.formerClient} />
              <span className="inline-flex items-center font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ color: "var(--fg-2)", background: "var(--bg-3)", border: "1px solid var(--border)" }}>
                {C.clientSince(fmtDate(profile.created_at))}
              </span>
            </div>
            <div className="mt-2.5 text-[13px]" style={muted}>
              <strong style={ink}>{C.goals}</strong> {profile.goals?.length ? profile.goals.join(" · ") : C.noGoals}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {userId && (
            <StartConversationButton recipientUserId={userId} messagesHref="/dashboard/trainer/messages" label={C.message} className="btn-ghost-v2 min-h-11" />
          )}
          {lead && active && (
            <button type="button" className="btn-ghost-v2 min-h-11" onClick={() => setStarting(true)}>
              {C.startAnother}
            </button>
          )}
          {lead ? (
            <Link href={`${TRAINER_PROGRAMS_CONFIG.basePath}/instances/${lead.id}`} className="btn-primary-v2 min-h-11">
              {C.openProgram}
            </Link>
          ) : (
            active && (
              <button type="button" className="btn-primary-v2 min-h-11" onClick={() => setStarting(true)}>
                {C.startProgram}
              </button>
            )
          )}
        </div>
      </div>

      {banner && (
        <p role="status" className="rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
          {banner}{" "}
          <button type="button" className="underline underline-offset-2" style={ink} onClick={onRetry}>
            {C.retry}
          </button>
        </p>
      )}

      {/* When I see them next, and this week */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Tile label={C.nextSession} value={next ? fmtDateTime(next.startsAt) : "-"} sub={nextSub} />
        <Tile
          label={C.thisWeek}
          value={week && week.scheduled > 0 ? C.weekDone(week.done, week.scheduled) : "-"}
          sub={lead && (!week || week.scheduled === 0) ? `${lead.name} · ${C.nothingDue}` : weekSub}
        />
      </div>

      {/* Session logs from the coach app (board coach-session-canvas 09, WEB1) */}
      <SessionLogsSection
        clientProfileId={clientId}
        clientFirstName={firstName}
        bookings={bookings.filter((b) => b.clientUserId === userId)}
        now={now}
      />

      {/* What they did, and the note it prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="min-w-0">
          {profile.is_active && <ProgramResultsSection clientProfileId={clientId} clientFirstName={firstName} summaries={programs} />}
        </div>
        <div className="flex flex-col gap-4">
          <DSCard>
            <div className="px-4 pt-3.5">
              <h2 className={h2} style={ink}>
                <label htmlFor="client-note">{C.noteTo(firstName)}</label>
              </h2>
            </div>
            <textarea
              id="client-note"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full px-4 py-3 text-[14px] resize-none"
              style={{ border: "none", background: "transparent", fontFamily: "inherit", color: "var(--ink)", minHeight: "72px" }}
              placeholder={C.notePlaceholder}
              maxLength={2000}
            />
            <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-[12px]" style={muted}>{C.noteHint(firstName)}</span>
              <button type="button" className="btn-primary-v2 sm" onClick={() => void saveNote()} disabled={!draft.trim() || saving}>
                {saving ? C.saving : C.saveNote}
              </button>
            </div>
          </DSCard>
          <DSCard className="px-4 py-3.5">
            {journals.length === 0 ? (
              <div className="text-[12.5px]" style={muted}>{C.noNotes}</div>
            ) : (
              <>
                {shownNotes.map((n, i) => (
                  <div key={n._id} className={i > 0 ? "mt-3 pt-3" : ""} style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
                    <div className="text-[13.5px] font-medium" style={ink}>{i === 0 ? C.lastNote(fmtDate(n.entry_date)) : fmtDate(n.entry_date)}</div>
                    <p className="text-[14px] leading-relaxed mt-1" style={{ color: "var(--fg-2)" }}>{n.notes || "-"}</p>
                  </div>
                ))}
                {journals.length > 1 && (
                  <button type="button" className="text-[12.5px] underline mt-2" style={ink} aria-expanded={allNotes} onClick={() => setAllNotes((v) => !v)}>
                    {allNotes ? C.fewerNotes : C.allNotes(journals.length)}
                  </button>
                )}
              </>
            )}
          </DSCard>
          <OneOffTasksCard clientProfileId={clientId} />
        </div>
      </div>

      {/* The record */}
      <div className="grid grid-cols-1 gap-4 items-start">
        {profile.is_active && <ClientReportsCard clientProfileId={clientId} clientFirstName={firstName} />}
      </div>

      {/* Body measurements: last (owner, 20 Nov 2026), trend one tap away */}
      <section aria-labelledby="body-heading">
        <h2 id="body-heading" className={`${h2} mb-3`} style={ink}>{C.body}</h2>
        <DSCard>
          <div className="flex items-start justify-between gap-3 px-4.5 py-4">
            <div>
              <Eyebrow>{C.latestWeight}</Eyebrow>
              <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", ...ink, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                {latestWeight ? latestWeight.weight_kg : "-"}
                {latestWeight && <small className="font-mono text-[12px] font-normal ml-1" style={muted}>kg</small>}
              </div>
              <div className="text-[12px] mt-1" style={muted}>
                {latestWeight
                  ? [C.logged(fmtDate(latestWeight.recorded_at)), profile.target_weight_kg ? C.target(profile.target_weight_kg) : null].filter(Boolean).join(" · ")
                  : C.noWeight}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {weights.length > 1 && (
                <button type="button" className="btn-ghost-v2 min-h-11" aria-expanded={trend} aria-controls="weight-trend" onClick={() => setTrend((v) => !v)}>
                  {trend ? C.hideTrend : C.showTrend}
                </button>
              )}
              {active && !logging && (
                <button type="button" className="btn-ghost-v2 min-h-11" onClick={() => setLogging(true)}>
                  {LOG_WEIGHT_LABEL}
                </button>
              )}
            </div>
          </div>
          {logging && (
            <div className="px-4.5 py-3.5" style={{ borderTop: "1px solid var(--border)" }}>
              <LogWeightForm
                clientProfileId={clientId}
                clientName={firstName}
                onCancel={() => setLogging(false)}
                onSaved={(log) => {
                  queryClient.setQueryData<ClientPageData>(clientPageKey(clientId), (d) => (d ? { ...d, weights: [log, ...d.weights] } : d));
                  setLogging(false);
                }}
              />
            </div>
          )}
          {trend && (
            <ul id="weight-trend" className="px-4.5 pt-1 pb-2.5" style={{ borderTop: "1px solid var(--border)" }}>
              {weights.map((w, i) => (
                <li key={w._id} className="flex justify-between text-[13px] py-1.5" style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <span style={{ color: "var(--fg-2)" }}>{fmtDate(w.recorded_at)}</span>
                  <span className="font-mono" style={ink}>{w.weight_kg} kg</span>
                </li>
              ))}
            </ul>
          )}
        </DSCard>
      </section>

      {starting && (
        <StartProgramDialog
          clientProfileId={clientId}
          clientName={firstName}
          programsPath={TRAINER_PROGRAMS_CONFIG.basePath}
          onClose={() => setStarting(false)}
          onStarted={() => {
            setStarting(false);
            void queryClient.invalidateQueries({ queryKey: clientPageKey(clientId) });
          }}
        />
      )}
    </>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <DSCard className="px-4.5 py-4">
      <Eyebrow>{label}</Eyebrow>
      <div className="text-[17px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", ...ink, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
        {value}
      </div>
      <div className="text-[12px] mt-1 truncate" style={muted}>{sub}</div>
    </DSCard>
  );
}
