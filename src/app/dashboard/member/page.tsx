"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { StatusPill } from "@/components/ds/StatusPill";
import { IconTile } from "@/components/ds/IconTile";
import { PageHeader } from "@/components/ds/PageHeader";
import { HeroStatCard } from "@/components/ds/HeroStatCard";
import { DSCard } from "@/components/ds/DSCard";
import { DSStatCard } from "@/components/ds/DSStatCard";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { ListRow } from "@/components/ds/ListRow";
import { WeekStrip } from "@/components/ds/WeekStrip";
import { Building2 } from "lucide-react";
import { bookingLabel } from "@/lib/bookings/labels";
import { bookingPaymentState } from "@/lib/bookings/paymentState";
import { bookingPaymentStateTone } from "@/lib/ui/statusTones";
import { weekStrip } from "@/lib/ui/activity";
import { useClientNow } from "@/lib/ui/useClientNow";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { CheckInHistoryPeriod, UserRole } from "@/lib/types";
import { checkinsService } from "@/lib/api/checkins";
import { classBookingsService } from "@/lib/api/classBookings";
import { consultationsService } from "@/lib/api/consultations";
import { loyaltyService } from "@/lib/api/loyalty";
import { marketplaceService } from "@/lib/api/marketplace";
import { currentProgramDay, myProgramsService, type ProgramDay } from "@/lib/api/myPrograms";
import { progressService } from "@/lib/api/progress";
import type { WeightLog } from "@/lib/api/progress";
import type { LoyaltyBalance } from "@/lib/types";
import { dayUnit, longestStreakLine, type StreakStats } from "@/lib/checkins/streak";
import {
  activeGyms,
  lastCheckInLabel,
  nextUp,
  weightSummary,
  type NextUpItem,
} from "./memberHome";

interface MemberSnapshot {
  checkins: StreakStats | null;
  /** Check-in moments from the last 7 days; null when the read failed. */
  weekCheckIns: string[] | null;
  next: NextUpItem | null;
  loyalty: LoyaltyBalance | null;
  loyaltyFailed: boolean;
  /** null when the read failed (no profile is not a failure: that's []). */
  weights: WeightLog[] | null;
  gyms: { orgId: string; name: string }[];
  program: ProgramDay | null;
}

const EMPTY: MemberSnapshot = {
  checkins: null,
  weekCheckIns: [],
  next: null,
  loyalty: null,
  loyaltyFailed: false,
  weights: [],
  gyms: [],
  program: null,
};

const CARD_PAD = "p-5.5";

export default function MemberHomePage() {
  // Role guard: a provider account (promoted during onboarding) landing
  // here gets redirected to its own dashboard instead of silently seeing
  // the member view. Wrapper component so the content's hooks don't run
  // for wrong-role visitors.
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  if (!isAuthorized) return null;
  return <MemberHomeContent />;
}

function settled<T>(res: PromiseSettledResult<{ data?: T }>): T | undefined {
  return res.status === "fulfilled" ? res.value.data : undefined;
}

/** The read came back and the API said it worked. */
function succeeded(res: PromiseSettledResult<{ success?: boolean }>): boolean {
  return res.status === "fulfilled" && res.value.success !== false;
}

function MemberHomeContent() {
  const { user } = useAuth();
  const now = useClientNow();
  const [snapshot, setSnapshot] = useState<MemberSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [checkinsRes, historyRes, bookingsRes, classesRes, loyaltyRes, profilesRes, subsRes, programsRes] =
          await Promise.allSettled([
            checkinsService.getMyDashboardStats(),
            checkinsService.getMyHistory(CheckInHistoryPeriod.WEEK),
            consultationsService.getMyBookings("upcoming"),
            classBookingsService.getMyClassBookings(),
            loyaltyService.getBalance(),
            progressService.getMyOwnProfiles(),
            marketplaceService.getMyMembershipSubscriptions(),
            myProgramsService.listMine(),
          ]);
        if (!isMounted) return;

        // A failed read is shown as "–", never as an empty history.
        let weights: WeightLog[] | null = succeeded(profilesRes) ? [] : null;
        const profileId = settled(profilesRes)?.[0]?._id;
        if (profileId) {
          try {
            // Enough for a 30-day change; the API returns newest first.
            const res = await progressService.getWeightLogs(profileId, 30);
            weights = res.success === false ? null : (res.data ?? []);
          } catch {
            weights = null;
          }
        }
        if (!isMounted) return;

        const at = Date.now();
        setSnapshot({
          checkins: (settled(checkinsRes) as StreakStats | undefined) ?? null,
          weekCheckIns: succeeded(historyRes) ? (settled(historyRes) ?? []).map((c) => c.checked_in_at) : null,
          next: nextUp(settled(bookingsRes) ?? [], settled(classesRes) ?? [], at),
          loyalty: settled(loyaltyRes) ?? null,
          loyaltyFailed: !succeeded(loyaltyRes),
          weights,
          gyms: activeGyms(settled(subsRes) ?? [], at),
          program: currentProgramDay(settled(programsRes) ?? []),
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
  }, []);

  const week = useMemo(
    () => (now && snapshot.weekCheckIns ? weekStrip(snapshot.weekCheckIns, now) : null),
    [snapshot.weekCheckIns, now],
  );
  const weight = useMemo(
    () => (now && snapshot.weights ? weightSummary(snapshot.weights, now.getTime()) : null),
    [snapshot.weights, now],
  );

  const stats = snapshot.checkins;
  // Check-ins only mean something to a gym member, or to someone who has
  // checked in before (a lapsed membership): everyone else gets no streak
  // hero, no week strip and no check-in stat.
  const checksIn = snapshot.gyms.length > 0 || (stats?.total_check_ins ?? 0) > 0;
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
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3.5">
        <div className="flex min-w-0 flex-col gap-3.5">
          {loading ? (
            <div aria-hidden="true" className="h-36 rounded-(--r-3) animate-pulse" style={{ background: "var(--bg-3)" }} />
          ) : (
            <MemberHero program={snapshot.program} stats={checksIn ? stats : null} />
          )}

          <section aria-labelledby="next-up-label">
            {/* Gaps go on wrappers: globals.css zeroes heading margins. */}
            <div className="mb-2">
              <Eyebrow id="next-up-label" as="h2">
                Next up
              </Eyebrow>
            </div>
            {loading ? (
              <div aria-hidden="true" className="h-15 rounded-(--r-3) animate-pulse" style={{ background: "var(--bg-3)" }} />
            ) : snapshot.next ? (
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
            ) : (
              <ListRow
                href="/marketplace"
                title="Nothing booked"
                meta="Browse the marketplace"
              />
            )}
          </section>

          {/* A pair when the member checks in; otherwise Weight takes the row. */}
          <div className={`grid gap-2.5 ${checksIn ? "grid-cols-2" : "grid-cols-1"}`}>
            {checksIn && (
              <DSStatCard
                size="sm"
                label="Check-ins · this week"
                value={loading || !week ? "–" : week.reduce((n, d) => n + d.count, 0)}
                delta={
                  stats && now
                    ? stats.last_check_in_at
                      ? `Last: ${lastCheckInLabel(stats.last_check_in_at, now)}`
                      : "None yet"
                    : undefined
                }
              />
            )}
            <DSStatCard
              size="sm"
              label="Weight"
              value={loading || !snapshot.weights ? "–" : weight ? weight.kg : "No log"}
              unit={weight ? "kg" : undefined}
              delta={
                loading || !snapshot.weights ? undefined : weight ? (
                  weight.delta
                ) : (
                  <Link href="/dashboard/member/weight-log" className="underline underline-offset-2">
                    Log your weight
                  </Link>
                )
              }
            />
          </div>

          {checksIn && (
            <DSCard className={CARD_PAD}>
              <div className="mb-3">
                <Eyebrow as="h2">Check-ins this week</Eyebrow>
              </div>
              {!loading && !snapshot.weekCheckIns ? (
                <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                  Couldn&rsquo;t load this week&rsquo;s check-ins. Try again later.
                </p>
              ) : week && !loading ? (
                <WeekStrip
                  days={week}
                  label="Check-ins this week"
                  stateLabels={{ done: "checked in", missed: "no check-in" }}
                />
              ) : (
                <div aria-hidden="true" className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="aspect-square rounded-(--r-2) animate-pulse" style={{ background: "var(--bg-3)" }} />
                  ))}
                </div>
              )}
            </DSCard>
          )}

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
                      <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                        Active membership · scan the front-desk QR to check in
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <StartConversationButton
                        organizationId={gym.orgId}
                        messagesHref="/dashboard/messages"
                        label="Message"
                      />
                      <Link href="/check-in" className="btn-primary-v2 sm" style={{ whiteSpace: "nowrap" }}>
                        Check in
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </DSCard>
          )}

          <DSCard className={CARD_PAD}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                Loyalty balance
              </h3>
              <Link
                href="/dashboard/loyalty"
                className="font-mono text-[11px] uppercase tracking-[0.04em]"
                style={{ color: "var(--fg-3)" }}
              >
                View all →
              </Link>
            </div>
            {loading && (
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                Loading...
              </div>
            )}
            {!loading && !snapshot.loyalty && snapshot.loyaltyFailed && (
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                Couldn&rsquo;t load your balance. Try again later.
              </div>
            )}
            {!loading && !snapshot.loyalty && !snapshot.loyaltyFailed && (
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                No loyalty activity yet. Start checking in to earn points.
              </div>
            )}
            {!loading && snapshot.loyalty && (
              <div className="flex items-baseline gap-3">
                <div
                  className="text-[32px] font-medium"
                  style={{ color: "var(--ink)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}
                >
                  {snapshot.loyalty.balance.toLocaleString()}
                </div>
                <Eyebrow as="span">points</Eyebrow>
              </div>
            )}
          </DSCard>
        </div>

        <div>
          <DSCard className={CARD_PAD}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)", marginBottom: 14 }}>
              Quick log
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { href: "/dashboard/member/weight-log", label: "Log weight" },
                { href: "/dashboard/member/meal-log", label: "Log meal" },
                { href: "/dashboard/member/workout-log", label: "Log workout" },
                { href: "/dashboard/bookings", label: "My bookings" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="btn-ghost-v2 sm w-full justify-center">
                  {item.label}
                </Link>
              ))}
            </div>
          </DSCard>
        </div>
      </div>
    </MemberDashboardShell>
  );
}

/**
 * The dark hero (owner ruling, Oct 2026): a program client sees "Day N of
 * M"; otherwise a gym member sees their check-in streak; anyone with
 * neither sees nothing. Programs have no streaks, so a member with both
 * gets the program; the streak stays one tap away under Activity.
 */
function MemberHero({ program, stats }: { program: ProgramDay | null; stats: StreakStats | null }) {
  if (program) {
    const { day, totalDays, week, name } = program;
    return (
      <HeroStatCard
        eyebrow="Your program"
        value={`Day ${day}`}
        unit={totalDays ? `of ${totalDays}` : undefined}
        sub={name}
        progress={
          totalDays
            ? { value: day, max: totalDays, label: `Progress through ${name}`, valueText: `Day ${day} of ${totalDays}` }
            : undefined
        }
        footnote={week ? `${week.done} of ${week.scheduled} tasks done · last 7 days` : undefined}
      />
    );
  }
  if (!stats) return null;
  const streak = stats.current_streak_days ?? 0;
  let sub: string;
  if (stats.has_checked_in_today) sub = "Checked in today";
  else if (stats.streak_at_risk) sub = "Check in today to keep it going";
  else if (streak === 0) sub = "Check in at your gym to start one";
  else sub = "Check in to grow it";
  return (
    <HeroStatCard
      eyebrow="Check-in streak"
      value={streak}
      unit={dayUnit(streak)}
      sub={sub}
      footnote={longestStreakLine(stats) ?? undefined}
    />
  );
}
