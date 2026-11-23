"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { DSCard, EmptySlate, Eyebrow, IconTile, StatusPill } from "@/components/ds";
import Modal from "@/components/Modal";
import SearchableSelect from "@/components/SearchableSelect";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { toast } from "@/components/Toast";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, ClientJournalEntry, DietPlan, WeightLog } from "@/lib/api/progress";
import { programsService, type ClientProgramSummary } from "@/lib/api/programs";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { DietPlanDeliveryType, PlanStatus } from "@/lib/types";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { useOnline } from "@/hooks/useOnline";
import OneOffTasksCard from "@/components/programs/OneOffTasksCard";
import ProgramResultsSection from "@/components/programs/results/ProgramResultsSection";
import { ClientReportsCard } from "@/components/progress-reports/ClientReportsCard";
import { DIETITIAN_PROGRAMS_CONFIG } from "@/components/programs/config";
import { StartProgramDialog } from "@/components/clients/StartProgramDialog";
import { LogWeightForm, LOG_WEIGHT_COPY } from "@/components/clients/LogWeightForm";
import { ClientMealsCard } from "@/components/clients/ClientMealsCard";
import { isTemplatePlan } from "@/app/dashboard/dietitian/meal-plans/_lib";
import { DIETITIAN_CLIENT_COPY as C, SESSION_LABEL } from "./copy";

/**
 * A client, for the dietitian at their desk. The trainer's client page
 * (board binectics-plans/design/coach-client-page, web #317 and #354) with the
 * dietitian's sections from mobile CoachClientScreen: meal plans and the meals
 * the client logged, with a reply. Order: when I see them next and this week;
 * what they did (program results, then meals) with the note beside it; the
 * record (meal plans, sessions, reports); body measurements last, as on the
 * trainer page (owner, 20 Nov 2026). Everything shown is real.
 */

interface ClientPageData {
  profile: ClientProfile;
  journals: ClientJournalEntry[];
  weights: WeightLog[];
  programs: ClientProgramSummary[];
  bookings: ConsultationBooking[];
  /** Null when the read failed: the section says so instead of "none". */
  plans: DietPlan[] | null;
}

/** Read everything the page shows. Only the profile is required; the rest degrade. */
async function loadClient(clientId: string): Promise<ClientPageData> {
  const [p, j, w, o, b, d] = await Promise.allSettled([
    progressService.getClientProfile(clientId),
    progressService.getClientJournalEntries(clientId, 20),
    progressService.getWeightLogs(clientId, 5),
    programsService.getClientOverview(clientId),
    consultationsService.getProviderBookings(),
    progressService.getDietPlans(clientId),
  ]);
  if (p.status !== "fulfilled" || !p.value.success || !p.value.data) throw new Error(C.errorTitle);
  return {
    profile: p.value.data,
    journals: j.status === "fulfilled" && j.value.success ? (j.value.data ?? []) : [],
    weights: w.status === "fulfilled" && w.value.success ? (w.value.data ?? []) : [],
    programs: o.status === "fulfilled" && o.value.success ? (o.value.data?.programs ?? []) : [],
    bookings: b.status === "fulfilled" && b.value.success ? (b.value.data ?? []) : [],
    plans: d.status === "fulfilled" && d.value.success ? (d.value.data ?? []) : null,
  };
}

const clientPageKey = (clientId: string) => ["dietitian-client-page", clientId] as const;

function clientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object" && profile.client_id) {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`.trim();
  }
  return "Client";
}

function clientUserId(profile: ClientProfile): string | null {
  return typeof profile.client_id === "object" && profile.client_id ? profile.client_id._id : profile.client_id || null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

const h2 = "text-[15px] font-medium";
const ink = { color: "var(--ink)" } as const;
const muted = { color: "var(--fg-3)" } as const;
const PROGRAMS_PATH = DIETITIAN_PROGRAMS_CONFIG.basePath;

export default function DietitianClientPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId;
  const online = useOnline();
  const query = useQuery({
    queryKey: clientPageKey(clientId ?? ""),
    queryFn: () => loadClient(clientId!),
    enabled: !!clientId,
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
    <DietitianDashboardShell activeItem="Clients" crumb={data ? clientName(data.profile) : "Client"}>
      {body}
    </DietitianDashboardShell>
  );
}

/** Loading: the page's own layout in grey. */
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
          {card(240)}
          {card(200)}
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
  const { profile, journals, weights, programs, bookings, plans } = data;
  const { fmtDate, fmtDateTime } = useOrgFormat();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [allNotes, setAllNotes] = useState(false);
  const [trend, setTrend] = useState(false);
  const [starting, setStarting] = useState(false);
  const [logging, setLogging] = useState(false);
  const [giving, setGiving] = useState(false);
  // "Now" for splitting next from past sessions, fixed when the page opens.
  const [now] = useState(() => Date.now());

  const name = clientName(profile);
  const firstName = name.split(" ")[0] || name;
  const userId = clientUserId(profile);
  const active = profile.is_active;
  const livePrograms = programs.filter((p) => p.kind === "program" && (p.status === "active" || p.status === "paused"));
  const lead = livePrograms[0];
  const week = lead?.progress?.last_7_days;
  const latestWeight = weights[0];

  const { next, recent } = useMemo(() => {
    const mine = bookings.filter((b) => b.clientUserId === userId);
    const upcoming = mine
      .filter((b) => (b.status === "CONFIRMED" || b.status === "PENDING") && Date.parse(b.endsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = mine
      .filter((b) => Date.parse(b.startsAt) <= now && !upcoming.includes(b))
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .slice(0, 5);
    return { next: upcoming[0] ?? null, recent: past };
  }, [bookings, userId, now]);

  const update = (fn: (d: ClientPageData) => ClientPageData) =>
    queryClient.setQueryData<ClientPageData>(clientPageKey(clientId), (d) => (d ? fn(d) : d));

  const saveNote = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await progressService.createClientJournalEntry(clientId, { notes: draft.trim() });
    setSaving(false);
    if (res.success && res.data) {
      const entry = res.data;
      update((d) => ({ ...d, journals: [entry, ...d.journals] }));
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
              <StatusPill tone={active ? "success" : "neutral"} label={active ? C.activeClient : C.formerClient} />
              <StatusPill tone="neutral" dot={false} label={C.clientSince(fmtDate(profile.created_at))} />
            </div>
            <div className="mt-2.5 text-[13px]" style={muted}>
              <strong style={ink}>{C.goals}</strong> {profile.goals?.length ? profile.goals.join(" · ") : C.noGoals}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {userId && (
            <StartConversationButton recipientUserId={userId} messagesHref="/dashboard/dietitian/messages" label={C.message} className="btn-ghost-v2 min-h-11" />
          )}
          {lead && active && (
            <button type="button" className="btn-ghost-v2 min-h-11" onClick={() => setStarting(true)}>
              {C.startAnother}
            </button>
          )}
          {lead ? (
            <Link href={`${PROGRAMS_PATH}/instances/${lead.id}`} className="btn-primary-v2 min-h-11">
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

      {/* What they did, and the note it prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="min-w-0 flex flex-col gap-6">
          {active && (
            <ProgramResultsSection clientProfileId={clientId} clientFirstName={firstName} summaries={programs} programsPath={PROGRAMS_PATH} />
          )}
          <ClientMealsCard clientProfileId={clientId} clientFirstName={firstName} canReply={active} />
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
              <button type="button" className="btn-primary-v2 sm min-h-11" onClick={() => void saveNote()} disabled={!draft.trim() || saving}>
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
                  <button type="button" className="text-[12.5px] underline mt-2 min-h-11" style={ink} aria-expanded={allNotes} onClick={() => setAllNotes((v) => !v)}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <MealPlansCard plans={plans} active={active} onGive={() => setGiving(true)} />
        <DSCard className="p-3.5">
          <section aria-labelledby="sessions-heading">
            <h2 id="sessions-heading" className={`${h2} mb-2`} style={ink}>{C.sessions}</h2>
            {!next && recent.length === 0 ? (
              <div className="text-[12.5px]" style={muted}>{C.noSessions}</div>
            ) : (
              [...(next ? [next] : []), ...recent].map((b) => (
                <div key={b.id} className="py-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex justify-between gap-2 text-[12.5px]">
                    <span style={{ ...ink, fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(b.startsAt)}</span>
                    <span style={muted}>{b === next ? C.next : SESSION_LABEL[b.status]}</span>
                  </div>
                  {b.completionNote && <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-2)" }}>{b.completionNote}</div>}
                </div>
              ))
            )}
            <Link href="/dashboard/dietitian/consultations" className="inline-flex items-center min-h-11 text-[12.5px] underline" style={ink}>
              {C.allSessions}
            </Link>
          </section>
        </DSCard>
        {active && <ClientReportsCard clientProfileId={clientId} clientFirstName={firstName} />}
      </div>

      {/* Body measurements last; weight is never coloured */}
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
                  {LOG_WEIGHT_COPY.open}
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
                  update((d) => ({ ...d, weights: [log, ...d.weights] }));
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
          programsPath={PROGRAMS_PATH}
          onClose={() => setStarting(false)}
          onStarted={() => {
            setStarting(false);
            void queryClient.invalidateQueries({ queryKey: clientPageKey(clientId) });
          }}
        />
      )}

      <GiveMealPlanModal
        open={giving}
        profileId={clientId}
        firstName={firstName}
        onClose={() => setGiving(false)}
        onGiven={(plan) => update((d) => ({ ...d, plans: [plan, ...(d.plans ?? [])] }))}
      />
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

/** The client's own meal plan copies, newest first, and "Give a meal plan" (mobile ClientMealPlansSection). */
function MealPlansCard({ plans, active, onGive }: { plans: DietPlan[] | null; active: boolean; onGive: () => void }) {
  const { fmtDate } = useOrgFormat();
  return (
    <DSCard className="p-3.5">
      <section aria-labelledby="meal-plans-heading">
        <div className="flex items-center gap-2.5 mb-2">
          <IconTile icon={ClipboardList} tone="meal" size="sm" />
          <h2 id="meal-plans-heading" className={h2} style={ink}>{C.mealPlans}</h2>
        </div>
        {plans === null ? (
          <div className="text-[12.5px]" style={muted}>{C.mealPlansLoadFailed}</div>
        ) : plans.length === 0 ? (
          <div className="text-[12.5px]" style={muted}>{C.noMealPlan}</div>
        ) : (
          <ul>
            {plans.map((p) => (
              <li key={p._id} className="py-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-medium truncate" style={ink}>{p.title}</span>
                  {p.status !== PlanStatus.ACTIVE && <StatusPill tone="neutral" label={C.paused} />}
                </div>
                <div className="text-[12px] mt-0.5" style={muted}>
                  {p.delivery_type === DietPlanDeliveryType.DOCUMENT ? C.document(p.document_file_name) : C.mealCount(p.meals.length)}
                  {" · "}
                  {C.assigned(fmtDate(p.assigned_at))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {active && plans !== null && (
          <button type="button" className="btn-ghost-v2 sm min-h-11 mt-2" onClick={onGive}>
            {plans.length === 0 ? C.giveMealPlan : C.giveAnother}
          </button>
        )}
      </section>
    </DSCard>
  );
}

/** Pick one of the dietitian's templates; the client gets their own copy. */
function GiveMealPlanModal({
  open,
  profileId,
  firstName,
  onClose,
  onGiven,
}: {
  open: boolean;
  profileId: string;
  firstName: string;
  onClose: () => void;
  onGiven: (plan: DietPlan) => void;
}) {
  const [templates, setTemplates] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void progressService.getProviderDietPlans().then((res) => {
      if (!alive) return;
      if (res.success && res.data) {
        // Only unassigned platform plans carry copyable content.
        setTemplates(
          res.data.filter((p) => isTemplatePlan(p) && p.delivery_type === DietPlanDeliveryType.PLATFORM && p.status === PlanStatus.ACTIVE),
        );
        setError(null);
      } else {
        setError(res.message || C.templatesFailed);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [open]);

  const give = async () => {
    const template = templates.find((t) => t._id === selected);
    if (!template) return;
    setBusy(true);
    // The server copies the template, keeping its day structure.
    const res = await progressService.assignDietPlanFromTemplate(profileId, template._id);
    setBusy(false);
    if (res.success && res.data) {
      toast.success(C.given(template.title, firstName));
      onGiven(res.data);
      setSelected("");
      onClose();
    } else {
      toast.error(res.message ?? C.giveFailed);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={C.pickerTitle}
      size="sm"
      disableCloseGuard
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost-v2 min-h-11" onClick={onClose}>
            {C.cancel}
          </button>
          <button type="button" className="btn-primary-v2 min-h-11" onClick={() => void give()} disabled={!selected || busy}>
            {busy ? C.giving : C.give}
          </button>
        </div>
      }
    >
      <p className="text-[13px] mb-3" style={{ color: "var(--fg-2)" }}>{C.pickerHelp}</p>
      <Eyebrow as="label">{C.template}</Eyebrow>
      <div className="mt-1.5">
        {error ? (
          <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>{error}</p>
        ) : !loading && templates.length === 0 ? (
          <EmptySlate
            message={C.noTemplates}
            mt="mt-0"
            action={
              <Link href="/dashboard/dietitian/meal-plans?new=1" className="text-[13px] underline" style={ink}>
                {C.newMealPlan}
              </Link>
            }
          />
        ) : (
          <SearchableSelect
            value={selected}
            onChange={setSelected}
            options={templates.map((t) => ({ label: `${t.title} · ${C.mealCount(t.meals.length)}`, value: t._id }))}
            placeholder={loading ? C.loadingTemplates : C.pickTemplate}
            loading={loading}
          />
        )}
      </div>
    </Modal>
  );
}
