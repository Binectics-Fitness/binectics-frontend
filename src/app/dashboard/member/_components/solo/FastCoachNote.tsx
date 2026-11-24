"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { messagingService } from "@/lib/api/messaging";
import { useMyDietPlans } from "@/lib/queries/progress";
import { todayWeekday } from "@/lib/progress/weeklyPlan";
import { fastCoachNote } from "@/lib/solo/fastCoachNote";
import { TELL_FAILED, fastDraft, fastDraftDay, tellLabel } from "@/lib/solo/fastingCopy";
import { formatHours, relativeDay, timeOfDay } from "@/lib/solo/fastingRules";
import styles from "./fasting.module.css";

/** Where the member's messages live, and the parameter that pre-fills the composer. */
export const MEMBER_MESSAGES_HREF = "/dashboard/messages";

/** The messages link behind "Tell <name>": the thread open, the draft waiting in the composer. */
export function tellHref(threadId: string, draft: string): string {
  return `${MEMBER_MESSAGES_HREF}?thread=${encodeURIComponent(threadId)}&draft=${encodeURIComponent(draft)}`;
}

/**
 * The coach note on the start page (Today board 07-Risks, R1 and R2; mobile
 * #251). Only for a member with a trainer or dietitian: who can't see fasts,
 * today's meal slots from a dietitian's plan, and "Tell <name>", which opens
 * that conversation with a draft built from this page's choices. Nothing is
 * sent: the draft waits in the composer until the member presses Send. Start
 * is never blocked, and on any failed read the page is as it was without it.
 */
export function FastCoachNote({
  nowMs,
  startAt,
  hours,
  canTell,
}: {
  nowMs: number;
  startAt: number;
  /** The chosen length, or null while it is not valid. */
  hours: number | null;
  /** False while the start time is not usable: there is nothing sensible to tell yet. */
  canTell: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  // Same key as the member home's coach card, so the two share one read.
  const providers = useQuery({
    queryKey: ["marketplace", user?.id ?? "", "my-providers"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await marketplaceService.getMyProviders();
      if (!res.success || !res.data) throw new Error(res.message ?? "Couldn't load your providers");
      return res.data;
    },
  });
  const hasCoach = (providers.data?.professionals.length ?? 0) > 0;
  const plans = useMyDietPlans(hasCoach);
  const [telling, setTelling] = useState(false);
  const [tellFailed, setTellFailed] = useState(false);

  // Wait for the plans so the note does not grow a sentence after it is read.
  if (!hasCoach || plans.isLoading) return null;
  const note = fastCoachNote(providers.data, plans.data ?? [], todayWeekday(new Date(nowMs)));
  if (!note) return null;

  const tell = async () => {
    if (hours === null || telling) return;
    const endAt = startAt + hours * 3_600_000;
    const draft = fastDraft({
      hours: formatHours(hours),
      startTime: timeOfDay(startAt),
      startDay: fastDraftDay(relativeDay(startAt, nowMs)),
      endTime: timeOfDay(endAt),
      endDay: fastDraftDay(relativeDay(endAt, nowMs)),
      mealPlan: note.mealPlan !== null,
    });
    setTelling(true);
    setTellFailed(false);
    try {
      // The member's existing conversation with them (relationship-gated, idempotent).
      const res = await messagingService.startThread({ recipient_user_id: note.tell.userId });
      if (res.success && res.data?.thread_id) router.push(tellHref(res.data.thread_id, draft));
      else setTellFailed(true);
    } catch {
      setTellFailed(true);
    } finally {
      setTelling(false);
    }
  };

  return (
    <div className={`${styles.coachNote} mt-4`} data-testid="fast-coach-note">
      <p className={styles.coachNoteRow}>
        <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" style={{ flex: "none", marginTop: 3 }} />
        <span>{note.mealPlan ? `${note.cantSee} ${note.mealPlan}` : note.cantSee}</span>
      </p>
      {hours !== null && canTell && (
        <button type="button" className={styles.tellBtn} onClick={() => void tell()} disabled={telling} aria-busy={telling || undefined}>
          {tellLabel(note.tell.firstName)}
        </button>
      )}
      {tellFailed && (
        <p role="alert" className={styles.error}>
          {TELL_FAILED}
        </p>
      )}
    </div>
  );
}
