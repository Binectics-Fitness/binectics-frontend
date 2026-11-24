"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { MyCoachesCard, useMyProviders } from "@/components/messaging/MyCoachesCard";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { StatusPill } from "@/components/ds/StatusPill";
import { IconTile } from "@/components/ds/IconTile";
import { PageHeader } from "@/components/ds/PageHeader";
import { HeroStatCard } from "@/components/ds/HeroStatCard";
import { DSCard } from "@/components/ds/DSCard";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { ListRow } from "@/components/ds/ListRow";
import { Building2 } from "lucide-react";
import { bookingLabel } from "@/lib/bookings/labels";
import { bookingPaymentState } from "@/lib/bookings/paymentState";
import { bookingPaymentStateTone } from "@/lib/ui/statusTones";
import { useClientNow } from "@/lib/ui/useClientNow";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { CheckInHistoryPeriod, UserRole } from "@/lib/types";
import { checkinsService } from "@/lib/api/checkins";
import { classBookingsService } from "@/lib/api/classBookings";
import { consultationsService } from "@/lib/api/consultations";
import { loyaltyService } from "@/lib/api/loyalty";
import { marketplaceService } from "@/lib/api/marketplace";
import type { FastSession } from "@/lib/api/fasting";
import { currentProgramDay, myProgramsService, type AgendaTask, type MyProgram, type ProgramDay } from "@/lib/api/myPrograms";
import type { LoyaltyProgram } from "@/lib/types";
import type { MyCheckInDashboardStats } from "@/lib/types";
import { memberGoalsService } from "@/lib/api/memberGoals";
import { countVisitsThisWeek, toWeekStart, visitsRow, type WeekStart } from "@/lib/checkins/visits";
import { useCurrentFast } from "@/lib/queries/fasting";
import { useActiveStarter } from "@/lib/queries/starter";
import { isStarterProgramEnabled } from "@/lib/starter/flag";
import { localStatus } from "@/lib/solo/fastingRules";
import {
  audienceOf,
  coachOf,
  coachTasks,
  darkCard,
  hasCoachPlan,
  hasHealthTask,
  linkedKinds,
  linkedKindsToday,
  planAsksWeightToday,
  providersOf,
  shortDay,
  showCoachList,
  startsLater,
} from "@/lib/today/oneToday";
import {
  PLAN_STARTS_HINT,
  TASKS_IN_APP,
  coachNoPlan,
  coachNoPlanHint,
  firstNameOf,
  planFrom,
  planStartsOn,
} from "@/lib/today/todayCopy";
import { VisitsRow } from "./_components/VisitsRow";
import { activeGyms, membershipNotice, nextUp, type MembershipNotice, type NextUpItem } from "./memberHome";
import { CoachCard } from "./_components/CoachCard";
import { EnrollmentOffersCard } from "./_components/EnrollmentOffersCard";
import { FastRow } from "./_components/FastRow";
import { GymClassesLink } from "./_components/GymClassesLink";
import { MembershipNoticeCard } from "./_components/MembershipNoticeCard";
import { OwnTracking } from "./_components/OwnTracking";
import { PendingRequestsCard } from "./_components/PendingRequestsCard";
import { ProgramAboutCard } from "./_components/ProgramAboutCard";
import { FastTodayCard } from "./_components/solo/FastTodayCard";
import { StarterCard } from "./_components/solo/StarterCard";
import { formatDate } from "@/utils/format";
import { useIsSoloMember } from "@/hooks/useIsSoloMember";
import { SoloToday, SoloTodayLoading } from "./_components/solo/SoloToday";

interface MemberSnapshot {
  checkins: MyCheckInDashboardStats | null;
  /** Check-in moments from the last 7 days; null when the read failed. */
  weekCheckIns: string[] | null;
  /** The member's week (Goals setting); Monday when unset or unread. */
  weekStart: WeekStart;
  next: NextUpItem | null;
  /**
   * The member's providers' loyalty programs (only those switched on). Empty,
   * or a failed read, shows no loyalty card at all: loyalty is a provider's
   * own opt-in, not something every member has.
   */
  loyalty: LoyaltyProgram[];
  gyms: { orgId: string; name: string }[];
  program: ProgramDay | null;
  /** Every program of the member's; null when the read failed (the plan is then unknown). */
  programs: MyProgram[] | null;
  /** Today's agenda, a coach's tasks only; null when the read failed. */
  tasks: AgendaTask[] | null;
  /** A membership that is overdue or ends this week with nothing renewing it. */
  notice: MembershipNotice | null;
}

const EMPTY: MemberSnapshot = {
  checkins: null,
  weekCheckIns: [],
  weekStart: "monday",
  next: null,
  loyalty: [],
  gyms: [],
  program: null,
  programs: [],
  tasks: [],
  notice: null,
};

/** "Sat, Oct 17": the day a term ends or a payment is due. */
const noticeDate = (iso: string) => formatDate(iso, { weekday: "short", month: "short", day: "numeric" });

const CARD_PAD = "p-5.5";

export default function MemberHomePage() {
  // Role guard: a provider account (promoted during onboarding) landing
  // here gets redirected to its own dashboard instead of silently seeing
  // the member view. Wrapper component so the content's hooks don't run
  // for wrong-role visitors.
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  if (!isAuthorized) return null;
  return <MemberHomeSwitch />;
}

/**
 * Today for a member on their own (no provider, nothing pending), otherwise
 * the coached Today. While the first answer is still coming the page shows
 * shapes; a read that fails falls back to the coached Today, never to a guess.
 */
function MemberHomeSwitch() {
  const { solo, isLoading } = useIsSoloMember();
  if (solo === true) return <SoloToday />;
  if (solo === null && isLoading) return <SoloTodayLoading />;
  return <MemberHomeContent />;
}

function settled<T>(res: PromiseSettledResult<{ data?: T }>): T | undefined {
  return res.status === "fulfilled" ? res.value.data : undefined;
}

/** The read came back and the API said it worked. */
function succeeded(res: PromiseSettledResult<{ success?: boolean }>): boolean {
  return res.status === "fulfilled" && res.value.success !== false;
}

/**
 * Today for a member with a gym, a coach or someone waiting on their answer
 * ("one Today", today-canvas Direction C; mobile HomeScreen). Top to bottom:
 * the pending-requests card, one status card at most (a membership, else the
 * coach card), one dark card at most (the program, then a running fast; the
 * loser is a light row), the visits row, the plan, Next up, then the member's
 * own tracking with its privacy line. Nothing animates on open.
 */
function MemberHomeContent() {
  const { user } = useAuth();
  const now = useClientNow();
  const [snapshot, setSnapshot] = useState<MemberSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped when the member accepts a gym's offer, so "My gyms" picks it up.
  const [reloadKey, setReloadKey] = useState(0);
  const myProviders = useMyProviders();
  const fasting = useCurrentFast();
  // A fast ended from the dark card: kept so the card does not vanish under its Undo.
  const [endedHere, setEndedHere] = useState<FastSession | null>(null);
  const starterOn = isStarterProgramEnabled();
  const starter = useActiveStarter(starterOn);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [checkinsRes, historyRes, bookingsRes, classesRes, loyaltyRes, subsRes, programsRes, goalsRes, agendaRes] =
          await Promise.allSettled([
            checkinsService.getMyDashboardStats(),
            checkinsService.getMyHistory(CheckInHistoryPeriod.WEEK),
            consultationsService.getMyBookings("upcoming"),
            classBookingsService.getMyClassBookings(),
            loyaltyService.getPrograms(),
            marketplaceService.getMyMembershipSubscriptions(),
            myProgramsService.listMine(),
            memberGoalsService.getSettings(),
            myProgramsService.agenda(),
          ]);
        if (!isMounted) return;

        const at = Date.now();
        const programs = succeeded(programsRes) ? (settled(programsRes) ?? []) : null;
        setSnapshot({
          checkins: settled(checkinsRes) ?? null,
          weekCheckIns: succeeded(historyRes) ? (settled(historyRes) ?? []).map((c) => c.checked_in_at) : null,
          weekStart: toWeekStart(succeeded(goalsRes) ? settled(goalsRes)?.week_start : undefined),
          next: nextUp(settled(bookingsRes) ?? [], settled(classesRes) ?? [], at),
          loyalty: settled(loyaltyRes) ?? [],
          gyms: activeGyms(settled(subsRes) ?? [], at),
          program: currentProgramDay(programs ?? []),
          programs,
          tasks: succeeded(agendaRes) ? coachTasks(settled(agendaRes)) : null,
          notice: membershipNotice(settled(subsRes) ?? [], new Date(at), noticeDate),
        });
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const providers = useMemo(() => providersOf(myProviders.data), [myProviders.data]);
  const coach = coachOf(providers);
  const coachFirst = coach ? firstNameOf(coach.name) : null;

  const stats = snapshot.checkins;
  // Check-ins only mean something to a gym member, or to someone who has
  // checked in before (a lapsed membership): everyone else gets no visits row.
  const checksIn = snapshot.gyms.length > 0 || (stats?.total_check_ins ?? 0) > 0;
  // This week's visits, in the member's week (null while unknown).
  const weekCount =
    now && snapshot.weekCheckIns ? countVisitsThisWeek(snapshot.weekCheckIns, now, snapshot.weekStart) : null;
  const visits = checksIn ? visitsRow({ stats, weekCount }) : null;

  // The plan.
  const program = snapshot.program;
  const tasks = snapshot.tasks ?? [];
  const hasStarter = starterOn && !!starter.data?.program;
  const later = now && !program ? startsLater(snapshot.programs, now) : null;
  const hasPlan = !!program || hasStarter || hasCoachPlan(snapshot.programs, tasks);
  const planUnknown = snapshot.programs === null || snapshot.tasks === null;

  // The member's own fast: dark when nothing outranks it (R6).
  const fast = fasting.data ?? null;
  const fastRunning = !!fast && !fast.ended_at;
  const dark = darkCard({ program: !!program, fastRunning: fastRunning || !!endedHere });

  // One status card at most: a membership first, then the coach card (no
  // plan from them yet, or a plan that starts later). Never "No plan" when
  // the plan could not be read.
  const coachCard =
    !loading && !snapshot.notice && !!coach && (!!later || (!hasPlan && !planUnknown));
  const pros = myProviders.data?.professionals.length ?? 0;

  const firstName = user?.first_name?.trim() || "there";
  const dateLine = now
    ? `${now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}${
        user?.country_code ? ` · ${user.country_code}` : ""
      }`
    : null;

  return (
    <MemberDashboardShell activeLabel="Home">
      <PageHeader
        eyebrow={dateLine ?? <span aria-hidden="true">&nbsp;</span>}
        title={{ before: "Hey, ", emphasis: firstName, after: "." }}
      />

      {error && (
        <div
          role="alert"
          className="rounded-(--r-3) p-4 mb-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger-ink)" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3.5">
        <div className="flex min-w-0 flex-col gap-3.5">
          {/* Whoever is asking to coach the member: nothing they would do can start until this is answered. */}
          <PendingRequestsCard />

          {/* The one status card: money that keeps the member's access (F8), else the coach. */}
          {!loading && snapshot.notice && <MembershipNoticeCard notice={snapshot.notice} />}
          {coachCard && coach && (
            later ? (
              <CoachCard
                coach={coach}
                line={planStartsOn(later.name, shortDay(later.startsOn))}
                hint={PLAN_STARTS_HINT}
              />
            ) : (
              <CoachCard coach={coach} line={coachNoPlan(coachFirst ?? coach.name)} hint={coachNoPlanHint(coachFirst ?? coach.name)} />
            )
          )}

          {loading ? (
            <div aria-hidden="true" className="h-36 rounded-(--r-3) animate-pulse" style={{ background: "var(--bg-3)" }} />
          ) : (
            <>
              {/* One dark card at most (R6): the program, then a running fast. */}
              {dark === "program" && program && (
                <div className="flex flex-col gap-3.5" data-testid="today-program">
                  <ProgramHero program={program} />
                  {fastRunning && fast && now && localStatus(fast, now.getTime()) === "running" ? (
                    <FastRow fast={fast} />
                  ) : fastRunning || endedHere ? (
                    <FastTodayCard fast={fastRunning ? fast : null} justEnded={endedHere} onEnded={setEndedHere} />
                  ) : null}
                </div>
              )}
              {dark === "fast" && (
                <FastTodayCard fast={fastRunning ? fast : null} justEnded={endedHere} onEnded={setEndedHere} />
              )}

              {/* Gym visits where the check-in streak was (board web-visits H1). */}
              {visits && <VisitsRow row={visits} href="/dashboard/member/activity" />}

              {hasStarter && <StarterCard />}

              {/* The program's today, after the visits row as on the phone. */}
              {program && <ProgramTodayCard from={coachFirst} />}
              {/* D4: the coach's description and cautions for this program. */}
              {program && (
                <div className="empty:hidden">
                  <ProgramAboutCard instanceId={program.id} />
                </div>
              )}
            </>
          )}

          <EnrollmentOffersCard onAccepted={() => setReloadKey((k) => k + 1)} />

          {!loading && snapshot.next && (
            <section aria-labelledby="next-up-label">
              {/* Gaps go on wrappers: globals.css zeroes heading margins. */}
              <div className="mb-2">
                <h2 id="next-up-label" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                  Next up
                </h2>
              </div>
              <ListRow
                href="/dashboard/bookings"
                title={snapshot.next.title}
                meta={snapshot.next.meta}
                trailing={
                  snapshot.next.booking ? (
                    <StatusPill
                      tone={bookingPaymentStateTone(bookingPaymentState(snapshot.next.booking))}
                      label={bookingLabel(snapshot.next.booking)}
                    />
                  ) : undefined
                }
              />
            </section>
          )}

          {/* The member's own tools, kept when they gain a coach (owner answer
              19 Nov 2026): full cards without a plan, one compact card with one. */}
          {/* Waits for the providers, so the privacy line never names nobody and then someone. */}
          {!loading && now && !myProviders.isLoading && (
            <OwnTracking
              mode={hasPlan ? "compact" : "full"}
              audience={audienceOf(providers)}
              providers={providers}
              fastRunning={fastRunning || !!endedHere}
              hideWeight={planAsksWeightToday(tasks, now)}
              linkedToday={linkedKindsToday(tasks, now)}
              linked={linkedKinds(tasks).fast || linkedKinds(tasks).water}
              healthTask={hasHealthTask(tasks)}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3.5">
          {!loading && snapshot.gyms.length > 0 && (
            <DSCard className={CARD_PAD}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)", marginBottom: 14 }}>
                {snapshot.gyms.length === 1 ? "My gym" : "My gyms"}
              </h3>
              <div className="flex flex-col gap-2">
                {snapshot.gyms.map((gym) => (
                  <div
                    key={gym.orgId}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-(--r-2)"
                    style={{ background: "var(--bg-2)" }}
                  >
                    {/* The row is about a gym: its tile takes the gym accent. */}
                    <IconTile icon={Building2} tone="gym" />
                    <div className="min-w-0 flex-1 basis-40">
                      <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                        {gym.name}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <StartConversationButton
                        organizationId={gym.orgId}
                        messagesHref="/dashboard/messages"
                        label="Message"
                        className="btn-ghost-v2 min-h-11"
                      />
                      <GymClassesLink organizationId={gym.orgId} gymName={gym.name} />
                      <Link href="/check-in" className="btn-primary-v2 min-h-11" style={{ whiteSpace: "nowrap" }}>
                        Check in
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </DSCard>
          )}

          {/* The coaches, with Message and Book; one coach is left out when the coach card or their plan already leads to them. */}
          <MyCoachesCard className={CARD_PAD} hidden={!showCoachList({ coaches: pros, coachCard, hasPlan: hasPlan || planUnknown })} />

          {!loading && snapshot.loyalty.length > 0 && (
            <DSCard className={CARD_PAD}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                  Loyalty points
                </h3>
                <Link
                  href="/dashboard/loyalty"
                  className="inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.04em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  Rewards →
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {snapshot.loyalty.map((p) => (
                  <div key={p.organization_id} className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] truncate" style={{ color: "var(--fg-2)" }}>
                      {p.organization_name || "Your provider"}
                    </span>
                    <span className="flex items-baseline gap-2 shrink-0">
                      <span
                        className="text-[24px] font-medium"
                        style={{ color: "var(--ink)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}
                      >
                        {p.balance.toLocaleString()}
                      </span>
                      <Eyebrow as="span">points</Eyebrow>
                    </span>
                  </div>
                ))}
              </div>
            </DSCard>
          )}
        </div>
      </div>
    </MemberDashboardShell>
  );
}

/**
 * The program's today, under the hero. Web has no task list (owner ruling
 * F17, 14 Oct 2026; being asked again): the card says where the tasks are.
 * A web task list, if the ruling changes, replaces the hint in this card
 * (the `program-task-list` slot) and nothing else on the page moves.
 */
function ProgramTodayCard({ from }: { from: string | null }) {
  return (
    <DSCard className="px-5 py-4">
      <section aria-labelledby="program-today-h" data-slot="program-task-list">
        <h2 id="program-today-h" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
          {planFrom(from)}
        </h2>
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--fg-3)" }} data-testid="tasks-in-app">
          {TASKS_IN_APP}
        </p>
      </section>
    </DSCard>
  );
}

/**
 * The dark hero (owner ruling, Oct 2026): a program client sees "Day N of
 * M". The check-in streak that stood here for everyone else is gone (owner
 * 19 Nov 2026: no platform streaks); gym visits show as the visits row.
 */
function ProgramHero({ program }: { program: ProgramDay }) {
  const { day, totalDays, week, name } = program;
  return (
    <HeroStatCard
      eyebrow="Your program"
      value={`Day ${day}`}
      unit={totalDays ? `of ${totalDays}` : undefined}
      // One line, as on the phone (board R5): the program, then the last 7 days.
      sub={week ? `${name} · ${week.done} of ${week.scheduled} done in the last 7 days` : name}
      progress={
        totalDays
          ? { value: day, max: totalDays, label: `Progress through ${name}`, valueText: `Day ${day} of ${totalDays}`, fill: "paper" }
          : undefined
      }
    />
  );
}
