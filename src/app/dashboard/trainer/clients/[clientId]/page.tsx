"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ds";
import { useParams } from "next/navigation";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { toast } from "@/components/Toast";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, ClientJournalEntry, WeightLog } from "@/lib/api/progress";
import { programsService, type ClientProgramSummary } from "@/lib/api/programs";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import OneOffTasksCard from "@/components/programs/OneOffTasksCard";
import { TRAINER_PROGRAMS_CONFIG } from "@/components/programs/config";

/**
 * A client, for the trainer at their desk: where they are on their programs,
 * their sessions, notes, and what's been sent. Everything shown is real.
 * The page used to carry prototype content (a "32-day streak", a "shoulder
 * monitor", pack balances, tabs that did nothing and a note box that didn't
 * save), which a trainer could mistake for this client's data.
 */

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

const SESSION_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Booked",
  COMPLETED: "Done",
  NO_SHOW: "No-show",
  CANCELLED: "Cancelled",
};

const card: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)" };

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId;
  const { fmtDate, fmtDateTime } = useOrgFormat();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [journals, setJournals] = useState<ClientJournalEntry[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [programs, setPrograms] = useState<ClientProgramSummary[] | null>(null);
  const [bookings, setBookings] = useState<ConsultationBooking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  // "Now" for splitting next from past sessions, fixed when the page opens.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    void Promise.allSettled([
      progressService.getClientProfile(clientId),
      progressService.getClientJournalEntries(clientId, 20),
      progressService.getWeightLogs(clientId, 5),
      programsService.getClientOverview(clientId),
      consultationsService.getProviderBookings(),
    ]).then(([p, j, w, o, b]) => {
      if (!active) return;
      if (p.status === "fulfilled" && p.value.success && p.value.data) setProfile(p.value.data);
      else setError("Couldn't load this client.");
      if (j.status === "fulfilled" && j.value.success) setJournals(j.value.data ?? []);
      if (w.status === "fulfilled" && w.value.success) setWeights(w.value.data ?? []);
      setPrograms(o.status === "fulfilled" && o.value.success ? (o.value.data?.programs ?? []) : []);
      setBookings(b.status === "fulfilled" && b.value.success ? (b.value.data ?? []) : []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [clientId]);

  const name = profile ? clientName(profile) : "Client";
  const firstName = name.split(" ")[0];
  const userId = profile ? clientUserId(profile) : null;

  const livePrograms = (programs ?? []).filter(
    (p) => p.kind === "program" && (p.status === "active" || p.status === "paused"),
  );
  const { next, recent } = useMemo(() => {
    const mine = (bookings ?? []).filter((b) => b.clientUserId === userId);
    const upcoming = mine
      .filter((b) => (b.status === "CONFIRMED" || b.status === "PENDING") && Date.parse(b.endsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = mine
      .filter((b) => Date.parse(b.startsAt) <= now && !upcoming.includes(b))
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .slice(0, 5);
    return { next: upcoming[0] ?? null, recent: past };
  }, [bookings, userId, now]);

  const latestWeight = weights[0];
  const lead = livePrograms[0];

  const saveNote = async () => {
    if (!clientId || !draft.trim()) return;
    setSaving(true);
    const res = await progressService.createClientJournalEntry(clientId, { notes: draft.trim() });
    setSaving(false);
    if (res.success && res.data) {
      setJournals((j) => [res.data!, ...j]);
      setDraft("");
      toast.success("Note saved.");
    } else {
      toast.error(res.message ?? "Couldn't save the note.");
    }
  };

  if (loading) {
    return (
      <TrainerDashboardShell activeItem="Clients" crumb="Client">
        <div className="rounded-(--r-3) p-6 text-[14px]" style={{ ...card, color: "var(--fg-3)" }}>
          Loading client…
        </div>
      </TrainerDashboardShell>
    );
  }

  if (!profile) {
    return (
      <TrainerDashboardShell activeItem="Clients" crumb="Client">
        <div className="rounded-(--r-3) p-6 text-[14px]" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error ?? "Client not found"}
        </div>
      </TrainerDashboardShell>
    );
  }

  const kpis = [
    {
      label: "Latest weight",
      value: latestWeight ? String(latestWeight.weight_kg) : "-",
      suffix: latestWeight ? "kg" : undefined,
      sub: latestWeight
        ? `${fmtDate(latestWeight.recorded_at)}${profile.target_weight_kg ? ` · target ${profile.target_weight_kg} kg` : ""}`
        : "No weight logged",
    },
    {
      label: "Program adherence",
      value: lead?.adherence_pct != null ? String(lead.adherence_pct) : "-",
      suffix: lead?.adherence_pct != null ? "%" : undefined,
      sub: lead ? lead.name : "Not on a program",
    },
    {
      label: "Next session",
      value: next ? fmtDateTime(next.startsAt) : "-",
      sub: next ? SESSION_LABEL[next.status] : "None booked",
      small: true,
    },
  ];

  return (
    <TrainerDashboardShell activeItem="Clients" crumb={name}>
      {/* Hero */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
        <div className="flex items-start gap-4">
          <span className="w-18 h-18 rounded-full flex items-center justify-center text-[18px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
            {initials(name)}
          </span>
          <div>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <StatusPill tone={profile.is_active ? "success" : "neutral"} label={profile.is_active ? "Active client" : "Paused client"} />
              <span className="inline-flex items-center font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ color: "var(--fg-2)", background: "var(--bg-3)", border: "1px solid var(--border)" }}>
                Client since {fmtDate(profile.created_at)}
              </span>
            </div>
            <div className="mt-2.5 text-[13px]" style={{ color: "var(--fg-3)" }}>
              <strong style={{ color: "var(--ink)" }}>Goals</strong> {profile.goals?.length ? profile.goals.join(" · ") : "No goals set"}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {userId && (
            <StartConversationButton recipientUserId={userId} messagesHref="/dashboard/trainer/messages" label="Message" />
          )}
          <Link href={TRAINER_PROGRAMS_CONFIG.basePath} className="btn-primary-v2 sm">
            {livePrograms.length ? "Programs" : "Assign a program"}
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={card}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`${k.small ? "text-[17px]" : "text-[24px]"} font-medium mt-1.5`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
              {k.value}
              {k.suffix && <small className="font-mono text-[12px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{k.suffix}</small>}
            </div>
            <div className="text-[12px] mt-1 truncate" style={{ color: "var(--fg-3)" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {clientId && <OneOffTasksCard clientProfileId={clientId} />}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Notes */}
        <section aria-labelledby="notes-heading" className="flex flex-col gap-3">
          <h2 id="notes-heading" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Notes</h2>
          <div className="rounded-(--r-3) overflow-hidden" style={card}>
            <label htmlFor="client-note" className="sr-only">Note for {firstName}</label>
            <textarea
              id="client-note"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full px-4 py-3 text-[14px] resize-none"
              style={{ border: "none", background: "transparent", fontFamily: "inherit", color: "var(--ink)", minHeight: "72px" }}
              placeholder={`How ${firstName}'s training is going, what to work on next`}
              maxLength={2000}
            />
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                {firstName} sees notes in their journal. Private session notes live on each session.
              </span>
              <button type="button" className="btn-primary-v2 sm" onClick={() => void saveNote()} disabled={!draft.trim() || saving}>
                {saving ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
          <div className="rounded-(--r-3)" style={card}>
            {journals.length === 0 ? (
              <div className="px-4 py-5 text-[13px]" style={{ color: "var(--fg-3)" }}>No notes yet.</div>
            ) : (
              journals.map((n, i) => (
                <div key={n._id} className="px-4 py-3.5" style={{ borderBottom: i < journals.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{fmtDateTime(n.entry_date)}</div>
                  <p className="text-[14px] leading-relaxed mt-1" style={{ color: "var(--fg-2)" }}>{n.notes || "No note"}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right rail */}
        <aside className="flex flex-col gap-4">
          <section aria-labelledby="programs-heading" className="rounded-(--r-3) p-3.5" style={card}>
            <h2 id="programs-heading" className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Programs</h2>
            {programs === null ? (
              <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading…</div>
            ) : livePrograms.length === 0 ? (
              <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Not on a program.</div>
            ) : (
              livePrograms.map((p) => {
                const week = p.progress?.last_7_days;
                const day = p.progress?.day;
                return (
                  <Link key={p.id} href={`${TRAINER_PROGRAMS_CONFIG.basePath}/instances/${p.id}`} className="block py-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex justify-between gap-2">
                      <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{p.name}</span>
                      {p.adherence_pct != null && (
                        <span className="font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>{p.adherence_pct}%</span>
                      )}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                      {[
                        p.status === "paused" ? "Paused" : day != null ? (p.progress?.total_days ? `Day ${day} of ${p.progress.total_days}` : `Day ${day}`) : null,
                        week && week.scheduled > 0 ? `${week.done} of ${week.scheduled} this week` : null,
                        p.counts.missed > 0 ? `${p.counts.missed} missed` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </Link>
                );
              })
            )}
          </section>

          <section aria-labelledby="sessions-heading" className="rounded-(--r-3) p-3.5" style={card}>
            <h2 id="sessions-heading" className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Sessions</h2>
            {bookings === null ? (
              <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading…</div>
            ) : !next && recent.length === 0 ? (
              <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>No sessions yet.</div>
            ) : (
              [...(next ? [next] : []), ...recent].map((b) => (
                <div key={b.id} className="py-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex justify-between gap-2 text-[12.5px]">
                    <span style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(b.startsAt)}</span>
                    <span style={{ color: "var(--fg-3)" }}>{b === next ? "Next" : SESSION_LABEL[b.status]}</span>
                  </div>
                  {b.completionNote && (
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-2)" }}>{b.completionNote}</div>
                  )}
                </div>
              ))
            )}
            <Link href="/dashboard/trainer/sessions" className="block text-[12.5px] underline mt-2" style={{ color: "var(--ink)" }}>
              All sessions
            </Link>
          </section>
        </aside>
      </div>
    </TrainerDashboardShell>
  );
}
