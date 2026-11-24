"use client";

/**
 * The coach Today's two triage lists, ported from the mobile coach Today
 * (CoachTodayScreen, mobile #82, #89, #119):
 *
 *  - CloseOutCard, "To close out": sessions that started and are still open.
 *    Each is marked done or a no-show right here; an unpaid hold says
 *    "Awaiting payment" instead and can't be closed out.
 *  - NeedsYou, "Needs you": forms clients submitted (opens the answers) and
 *    tasks they missed (opens the client), newest first, at most six.
 *
 * Shared by the trainer and dietitian Today (CoachToday).
 */
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CircleAlert, ClipboardCheck } from "lucide-react";
import { DSCard, DSCardHead, Eyebrow, IconTile, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import {
  ATTENTION_LIMIT,
  attentionHref,
  attentionLine,
  type AttentionItem,
} from "@/lib/api/coachAttention";
import { attentionTone } from "@/lib/ui/statusTones";
import { bookingClientName, canCloseOut, durationMinutes } from "./coachSchedule";

/** Copy shared with mobile (constants/coachClientsCopy.ts, utils/coachDay.ts). */
export const TRIAGE_COPY = {
  closeOutTitle: "To close out",
  closeOutHint: "Started earlier.",
  awaitingPayment: "Awaiting payment",
  markDone: "Mark done",
  noShow: "No-show",
  needsYou: "Needs you",
  saveFailed: "Couldn't save that. Try again.",
} as const;

type CloseKind = "done" | "no_show";

export interface CloseOutCardProps {
  sessions: ConsultationBooking[];
  nowMs: number;
  noun: "session" | "consult";
  /** "09:00" in the org's zone. */
  time: (iso: string) => string;
  /** A second gutter line for a session that didn't start today, e.g. "Yesterday". */
  daySub: (iso: string) => string | undefined;
  /** Where the client's name goes: the session (trainer) or the client (dietitian). */
  rowHref: (booking: ConsultationBooking) => string | undefined;
  /** Re-read the page once a session is closed. */
  onClosed?: () => Promise<void> | void;
}

export function CloseOutCard({ sessions, nowMs, noun, time, daySub, rowHref, onClosed }: CloseOutCardProps) {
  const [busy, setBusy] = useState<{ id: string; kind: CloseKind } | null>(null);
  const Noun = noun === "session" ? "Session" : "Consult";

  const close = async (b: ConsultationBooking, kind: CloseKind) => {
    if (busy) return;
    const name = bookingClientName(b);
    setBusy({ id: b.id, kind });
    let ok = false;
    try {
      const res =
        kind === "done" ? await consultationsService.completeBooking(b.id) : await consultationsService.markNoShow(b.id);
      ok = res.success;
      if (ok) toast.success(kind === "done" ? `${Noun} with ${name} marked done` : `${name} marked as a no-show`);
      else toast.error(res.message ?? TRIAGE_COPY.saveFailed);
    } catch {
      toast.error(TRIAGE_COPY.saveFailed);
    }
    if (ok) {
      try {
        await onClosed?.();
      } catch {
        // Saved; a failed refresh only leaves the row until the next load.
      }
    }
    setBusy(null);
  };

  return (
    <DSCard>
      <DSCardHead title={TRIAGE_COPY.closeOutTitle} subtitle={TRIAGE_COPY.closeOutHint} />
      <ul aria-label={`${noun === "session" ? "Sessions" : "Consults"} to close out`} className="flex flex-col">
        {sessions.map((b, i) => {
          const name = bookingClientName(b);
          const href = rowHref(b);
          const sub = daySub(b.startsAt);
          const closable = canCloseOut(b, nowMs);
          const meta = [b.consultationTypeName, `${durationMinutes(b)} min`].filter(Boolean).join(" · ");
          const rowBusy = busy?.id === b.id;
          return (
            <li
              key={b.id}
              data-close-out-row
              className="flex flex-col gap-2.5 px-4.5 py-3 sm:flex-row sm:items-center"
              style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="w-14 shrink-0 font-mono text-[12px]"
                  style={{ color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}
                >
                  <div>{time(b.startsAt)}</div>
                  {sub && <div className="mt-0.5 text-[11px]" style={{ color: "var(--fg-3)" }}>{sub}</div>}
                </div>
                <div className="min-w-0 flex-1">
                  {href ? (
                    <Link
                      href={href}
                      className="block truncate text-[14px] font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ color: "var(--ink)" }}
                    >
                      {name}
                    </Link>
                  ) : (
                    <div className="truncate text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                      {name}
                    </div>
                  )}
                  <div className="mt-0.5 truncate text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                    {meta}
                  </div>
                </div>
              </div>
              {closable ? (
                <div className="flex shrink-0 gap-2" role="group" aria-label={`Close out ${name}'s ${noun}`}>
                  <button
                    type="button"
                    className="btn-primary-v2 sm h-11! flex-1 px-4! text-[13px]! sm:flex-none"
                    disabled={busy !== null}
                    aria-busy={rowBusy && busy?.kind === "done"}
                    onClick={() => void close(b, "done")}
                  >
                    {rowBusy && busy?.kind === "done" ? "Saving…" : TRIAGE_COPY.markDone}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-v2 sm h-11! flex-1 px-4! text-[13px]! sm:flex-none"
                    disabled={busy !== null}
                    aria-busy={rowBusy && busy?.kind === "no_show"}
                    onClick={() => void close(b, "no_show")}
                  >
                    {rowBusy && busy?.kind === "no_show" ? "Saving…" : TRIAGE_COPY.noShow}
                  </button>
                </div>
              ) : (
                <div className="shrink-0">
                  <StatusPill tone="warn" label={TRIAGE_COPY.awaitingPayment} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </DSCard>
  );
}

export interface NeedsYouProps {
  items: AttentionItem[];
  /** The org's today, YYYY-MM-DD: "today" / "yesterday" in the lines. */
  today: string;
  clientHref: (profileId: string) => string;
}

export function NeedsYou({ items, today, clientHref }: NeedsYouProps) {
  if (items.length === 0) return null;
  const rows = items.slice(0, ATTENTION_LIMIT);
  return (
    <section aria-labelledby="coach-needs-you" className="flex flex-col gap-2 min-w-0">
      <div className="px-0.5">
        <Eyebrow as="h2" id="coach-needs-you">
          {TRIAGE_COPY.needsYou}
        </Eyebrow>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((a) => {
          const opensAnswers = a.kind === "form_submitted" && Boolean(a.formId);
          return (
            <li key={`${a.kind}-${a.client.profileId}-${a.at}`}>
              <Link
                href={attentionHref(a, clientHref)}
                data-attention-kind={a.kind}
                className="flex min-h-11 w-full items-center gap-3 rounded-(--r-3) px-3.5 py-3 transition-colors duration-(--motion-fast) hover:bg-(--bg-2) focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <IconTile
                  icon={a.kind === "form_submitted" ? ClipboardCheck : CircleAlert}
                  tone={attentionTone(a.kind)}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                    {a.client.name}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] line-clamp-2" style={{ color: "var(--fg-2)" }}>
                    {attentionLine(a, today)}
                  </span>
                </span>
                <span className="sr-only">{opensAnswers ? ". Opens their answers" : ". Opens the client"}</span>
                <ChevronRight aria-hidden="true" size={14} className="shrink-0" style={{ color: "var(--fg-4)" }} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
