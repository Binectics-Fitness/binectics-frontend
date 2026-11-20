"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { DSCard } from "@/components/ds";
import { StatusPill } from "@/components/ds/StatusPill";
import { healthFormsService, type StaffHealthForm, type StaffHealthFormAnswers } from "@/lib/api/healthForms";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { HEALTH_FORM_COPY as C } from "@/lib/constants/healthFormCopy";

/** Whether the card shows: the gym asks for the form, or one exists. */
export function showsHealthCard(s: StaffHealthForm | null | undefined): s is StaffHealthForm {
  return !!s && (s.status !== "not_sent" || s.required);
}

export function answerLabel(a: StaffHealthFormAnswers["answers"][number]): string {
  if (a.type === "MULTIPLE_CHOICE") return a.value === "yes" ? C.yes : a.value === "no" ? C.no : "";
  return a.value || C.noDetails;
}

/**
 * The gym's PAR-Q health form for this member (board parq W1-W3): not done,
 * or done with the follow-up flag and "Mark followed up". Answers load only
 * on "Show answers"; that read is audit-logged on the API. Shown to the owner
 * and staff with marketplace:manage_listing; anyone else gets nothing (the
 * API refuses them with 403).
 */
export function HealthFormCard({ orgId, memberUserId }: { orgId: string; memberUserId: string }) {
  const { fmtDate } = useOrgFormat();
  const qc = useQueryClient();
  const key = ["healthForm", orgId, memberUserId];
  const { data: status } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await healthFormsService.status(orgId, memberUserId);
      return res.success && res.data ? res.data : null;
    },
  });
  const [answers, setAnswers] = useState<StaffHealthFormAnswers["answers"] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showsHealthCard(status)) return null;
  const done = status.status === "done";

  const toggle = async () => {
    if (open) return setOpen(false);
    setError(null);
    const res = await healthFormsService.answers(orgId, memberUserId);
    if (res.success && res.data) {
      setAnswers(res.data.answers);
      setOpen(true);
    } else setError(C.answersFailed);
  };

  const followUp = async () => {
    setBusy(true);
    setError(null);
    const res = await healthFormsService.markFollowedUp(orgId, memberUserId);
    if (res.success && res.data) qc.setQueryData(key, res.data);
    else setError(C.saveFailed);
    setBusy(false);
  };

  return (
    <DSCard className="p-5.5 flex flex-col gap-2" data-testid="health-form-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
          {C.cardTitle}
        </h3>
        <StatusPill tone={done ? "success" : "neutral"} label={done ? C.donePill : C.notDonePill} />
      </div>

      {!done ? (
        <>
          <p className="text-[13.5px]" style={{ color: "var(--ink)" }}>{C.notDone}</p>
          {status.sent_at && (
            <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>{C.sentOn(fmtDate(status.sent_at))}</p>
          )}
        </>
      ) : (
        <>
          {status.submitted_at && (
            <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>{C.doneOn(fmtDate(status.submitted_at))}</p>
          )}
          {status.needs_follow_up && status.followed_up_at && (
            <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
              {C.followedUp(status.followed_up_by_name, fmtDate(status.followed_up_at))}
            </p>
          )}
          {status.needs_follow_up && !status.followed_up_at && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-(--r-2) px-3 py-2.5"
              style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}
            >
              <span className="flex items-center gap-2 text-[13.5px] font-medium">
                <Bell size={16} aria-hidden className="flex-none" />
                {C.flag}
              </span>
              <button type="button" className="btn-ghost-v2 md" disabled={busy} onClick={followUp}>
                {C.markFollowedUp}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="self-start text-[13px] underline min-h-[32px]"
            style={{ color: "var(--fg-2)" }}
          >
            {open ? C.hideAnswers : C.showAnswers}
          </button>
          {open && answers && (
            <div className="flex flex-col" data-testid="health-form-answers">
              {answers.map((a) => {
                const yes = a.type === "MULTIPLE_CHOICE" && a.value === "yes";
                const text = a.type !== "MULTIPLE_CHOICE";
                return (
                  <div
                    key={a.index}
                    className="flex justify-between gap-3 py-2 text-[13px]"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span className="flex-1" style={{ color: "var(--fg-2)" }}>{a.label}</span>
                    <span
                      className={text ? "flex-1 text-right" : "flex-none font-medium self-start rounded-(--r-1) px-1.5"}
                      style={yes ? { color: "var(--warn-ink)", background: "var(--warn-soft)" } : { color: "var(--ink)" }}
                    >
                      {answerLabel(a)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>{error}</p>
      )}
    </DSCard>
  );
}
