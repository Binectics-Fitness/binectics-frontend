"use client";

import Link from "next/link";
import { DSCard } from "@/components/ds/DSCard";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { Avatar } from "@/components/messaging/Avatar";
import { initials } from "@/components/messaging/format";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import type { Coach } from "@/lib/today/oneToday";
import { useBookHref } from "@/lib/today/useBookHref";
import { COACH_BOOK, COACH_EYEBROW, COACH_MESSAGE } from "@/lib/today/todayCopy";

/**
 * The coach card (today-canvas C1, S2; mobile components/today/CoachCard):
 * who the coach is and the one or two things to do with them, as real
 * buttons. Shown while there is no plan yet, or for a plan that starts on a
 * later day. Message is the primary action; "Book a session" sits beside it
 * when the coach has something to book.
 */
export function CoachCard({
  coach,
  line,
  hint,
  primary,
}: {
  coach: Coach;
  /** "No plan from Tunde yet." */
  line: string;
  /** The quieter second line. */
  hint?: string;
  /** Replaces Message as the primary action (S2: "See the plan"); Message then comes second. */
  primary?: { label: string; href: string };
}) {
  const book = useBookHref(coach);
  const message = (
    <StartConversationButton
      recipientUserId={coach.userId}
      messagesHref="/dashboard/messages"
      label={COACH_MESSAGE}
      ariaLabel={`Message ${coach.name}`}
      className={`${primary ? "btn-ghost-v2" : "btn-primary-v2"} w-full justify-center`}
    />
  );
  return (
    <div data-testid="today-coach-card">
    <DSCard className="p-5">
      <div className="flex items-center gap-3">
        {coach.imageUrl ? (
          <Avatar name={coach.name} url={coach.imageUrl} size={36} />
        ) : (
          // The role's accent, filled (as the phone's avatar): identity, not status.
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
            style={{ background: `var(--${coach.kind})`, color: "var(--ink)" }}
          >
            {initials(coach.name)}
          </span>
        )}
        <div className="min-w-0">
          <Eyebrow>{COACH_EYEBROW[coach.kind]}</Eyebrow>
          <h2 className="text-[16px] font-medium break-words" style={{ color: "var(--ink)" }}>
            {coach.name}
          </h2>
        </div>
      </div>
      <p className="mt-3.5 text-[15px]" style={{ color: "var(--ink)" }}>
        {line}
      </p>
      {hint && (
        <p className="mt-0.5 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
          {hint}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2.5 [&>*]:min-h-11">
        {primary ? (
          <Link href={primary.href} className="btn-primary-v2 w-full justify-center" style={{ height: 44 }}>
            {primary.label}
          </Link>
        ) : null}
        {message}
        {!primary && book ? (
          <Link
            href={book}
            className="btn-ghost-v2 w-full justify-center"
            style={{ height: 44 }}
            aria-label={`Book a session with ${coach.name}`}
          >
            {COACH_BOOK}
          </Link>
        ) : null}
      </div>
    </DSCard>
    </div>
  );
}
