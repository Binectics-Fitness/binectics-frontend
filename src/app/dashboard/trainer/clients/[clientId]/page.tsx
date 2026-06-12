"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, ClientJournalEntry } from "@/lib/api/progress";

/**
 * Client detail — client.html prototype.
 * Hero with avatar + badges + KPIs, sticky tab nav, coaching notes, right-rail signals.
 */

function clientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object") {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return profile.client_id;
}

function clientInitials(profile: ClientProfile): string {
  const name = clientName(profile);
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SIGNALS = [
  { color: "var(--signal)", title: "Streak momentum", desc: "32 consecutive days. Longest since joining. Worth acknowledging — it sustains itself after 30." },
  { color: "var(--warn)", title: "Shoulder monitor", desc: "Left shoulder click on OHP noted May 14. 2-week window before referral. Check in Wed." },
  { color: "var(--gym)", title: "Pack completion", desc: "10 sessions left on 24-pack. At current pace, expires Jul 8. Plan renewal conversation around session 20." },
];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "After session": { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  "Programming": { bg: "var(--gym-soft)", color: "var(--gym)" },
  "Health flag": { bg: "oklch(0.95 0.03 25)", color: "var(--danger)" },
  "Personal": { bg: "var(--bg-3)", color: "var(--fg-2)" },
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId;

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [journals, setJournals] = useState<ClientJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    Promise.all([
      progressService.getClientProfile(clientId),
      progressService.getClientJournalEntries(clientId, 20),
    ])
      .then(([profileRes, journalsRes]) => {
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else {
          setError("Failed to load client profile");
        }

        if (journalsRes.success && journalsRes.data) {
          setJournals(journalsRes.data ?? []);
        }
      })
      .catch(() => setError("Failed to load client profile"))
      .finally(() => setLoading(false));
  }, [clientId]);

  const kpis = useMemo(() => {
    const latestWeight = journals.find((j) => typeof j.weight_kg === "number")
      ?.weight_kg;
    return [
      {
        label: "Journal entries",
        value: String(journals.length),
        delta: journals.length > 0 ? "Recent logs available" : "No entries yet",
      },
      {
        label: "Goals",
        value: String(profile?.goals.length ?? 0),
        delta:
          profile && profile.goals.length > 0
            ? profile.goals.slice(0, 1)[0]
            : "No goals set",
      },
      {
        label: "Latest weight",
        value: latestWeight !== undefined ? String(latestWeight) : "—",
        suffix: latestWeight !== undefined ? "kg" : undefined,
        delta: latestWeight !== undefined ? "From journal log" : "No weight logs",
      },
    ];
  }, [journals, profile]);

  if (loading) {
    return (
      <TrainerDashboardShell activeItem="Clients" crumb="Client">
        <div className="rounded-(--r-3) p-6 text-[14px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-3)" }}>
          Loading client details…
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

  return (
    <TrainerDashboardShell activeItem="Clients" crumb={clientName(profile)}>
      {/* Hero */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
        <div className="flex items-start gap-4">
          <span className="w-18 h-18 rounded-full flex items-center justify-center text-[18px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
            {clientInitials(profile)}
          </span>
          <div>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
              {clientName(profile)}
            </h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: profile.is_active ? "Active client" : "Paused client", signal: true },
                { label: `Created ${new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` },
                { label: `${profile.goals.length} goals` },
              ].map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.25 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ color: b.signal ? "var(--signal-ink)" : "var(--fg-2)", background: b.signal ? "var(--signal-soft)" : "var(--bg-3)", border: "1px solid var(--border)" }}>
                  {b.signal && <span className="w-1.25 h-1.25 rounded-full" style={{ background: "currentColor" }} />}
                  {b.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[13px]" style={{ color: "var(--fg-3)" }}>
              <span><strong style={{ color: "var(--ink)" }}>Goals</strong> {profile.goals.length > 0 ? profile.goals.join(" · ") : "No goals set"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-ghost-v2 sm">Message</button>
          <button className="btn-ghost-v2 sm">Book session</button>
          <button className="btn-primary-v2 sm">+ Update program</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {k.value}{k.suffix && <small className="font-mono text-[12px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{k.suffix}</small>}
            </div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <nav className="flex gap-0 -mx-7 px-7 border-b border-border sticky top-14 z-10 overflow-x-auto flex-nowrap whitespace-nowrap" style={{ background: "var(--bg-2)" }}>
        {["Overview", "Notes · 18", "Program", "Health log", "Sessions · 14", "Billing"].map((t, i) => (
          <span key={t} className={`px-4 py-3.5 text-[13.5px] -mb-px cursor-pointer ${i === 1 ? "border-b-2 border-ink font-medium" : ""}`} style={{ color: i === 1 ? "var(--ink)" : "var(--fg-3)" }}>{t}</span>
        ))}
      </nav>

      {/* Content: Notes + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Notes */}
        <div>
          <div className="flex flex-col gap-0">
            {journals.map((n, i) => {
              const tc = TYPE_COLORS["Personal"];
              return (
                <div key={n._id} className="flex gap-4 py-4" style={{ borderBottom: i < journals.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-10 flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: "var(--ink)" }} />
                    {i < journals.length - 1 && <div className="w-px flex-1" style={{ background: "var(--border)" }} />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-(--r-1)" style={{ color: tc.color, background: tc.bg }}>Journal</span>
                      <span className="font-mono text-[11px]" style={{ color: "var(--fg-4)" }}>{formatDate(n.entry_date)}</span>
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-2)" }}>{n.notes || "No note"}</p>
                  </div>
                </div>
              );
            })}
            {journals.length === 0 && (
              <div className="py-6 text-center font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>
                No journal entries yet.
              </div>
            )}
          </div>

          {/* Compose */}
          <div className="mt-4 rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <textarea className="w-full px-4 py-3 text-[14px] resize-none" style={{ border: "none", background: "transparent", fontFamily: "inherit", color: "var(--ink)", minHeight: "72px" }} placeholder="Write a note about Linda…" />
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex gap-1.5">
                {["After session", "Programming", "Health flag", "Personal"].map((t) => {
                  const tc = TYPE_COLORS[t];
                  return <span key={t} className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-(--r-1) cursor-pointer" style={{ color: tc.color, background: tc.bg }}>{t}</span>;
                })}
              </div>
              <button className="btn-primary-v2 sm">Save note</button>
            </div>
          </div>
        </div>

        {/* Right rail — Signals */}
        <div className="flex flex-col gap-4 sticky top-28">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Signals</div>
          {SIGNALS.map((s) => (
            <div key={s.title} className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="flex gap-3 p-3.5" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{s.title}</div>
                  <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>{s.desc}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Quick stats */}
          <div className="rounded-(--r-3) p-3.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Quick stats</div>
            {[
              { k: "Next session", v: "Wed 20 May · 08:30" },
              { k: "Sessions remaining", v: "10 of 24" },
              { k: "Pack expires", v: "8 Jul 2026" },
              { k: "Total paid", v: "R 16,800" },
            ].map((s) => (
              <div key={s.k} className="flex justify-between py-1.5 text-[12.5px]">
                <span style={{ color: "var(--fg-3)" }}>{s.k}</span>
                <span className="font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
