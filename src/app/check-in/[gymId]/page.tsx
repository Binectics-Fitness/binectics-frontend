"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { SuccessTakeover } from "@/components/ds/SuccessTakeover";
import { HeroStatCard } from "@/components/ds/HeroStatCard";
import { useAuth } from "@/contexts/AuthContext";
import { checkinsService } from "@/lib/api/checkins";
import { dayUnit, isPersonalBest, longestStreakLine, type StreakStats } from "@/lib/checkins/streak";

type Outcome =
  | { state: "working" }
  | { state: "scan_required"; gymName: string }
  | {
      state: "success";
      gymName: string;
      /** When the API recorded it (the scan response), not the device clock. */
      checkedInAt: string | null;
      /** Read after the scan; null if that read failed. */
      stats: StreakStats | null;
    }
  | { state: "already"; gymName: string }
  | {
      state: "no_subscription";
      gymName: string;
      /** Published marketplace listing, when the gym has a storefront. */
      listingId: string | null;
    }
  | { state: "error"; message: string };

/**
 * The page the gym's rotating QR opens on the member's phone. The route
 * is middleware-protected, so an anonymous scan goes login → back here.
 *
 * The ?t= token from the QR is the presence proof: with one, the
 * check-in fires immediately (the API judges freshness); without one —
 * bookmarked URL, shared link, typed path — nothing is logged and the
 * member is pointed at the scanner.
 */
export default function CheckInScanPage() {
  return (
    <Suspense fallback={null}>
      <CheckInScanContent />
    </Suspense>
  );
}

function CheckInScanContent() {
  const params = useParams<{ gymId: string }>();
  const searchParams = useSearchParams();
  // Org id on current QRs; legacy printed QRs carry a listing id — the
  // backend resolves either.
  const gymId = params.gymId;
  const qrToken = searchParams.get("t");
  const [outcome, setOutcome] = useState<Outcome>({ state: "working" });
  const { user } = useAuth();
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !gymId) return;
    firedRef.current = true;

    const run = async () => {
      // Gym name + optional storefront for every outcome screen (public
      // endpoint; resolves either an org id or a legacy listing id).
      const infoRes = await checkinsService.getGymInfo(gymId);
      const gymName = (infoRes.success && infoRes.data?.name) || "this gym";
      const storeListingId =
        (infoRes.success && infoRes.data?.listing_id) || null;

      if (!qrToken) {
        setOutcome({ state: "scan_required", gymName });
        return;
      }
      await fireScan(gymName, storeListingId);
    };

    const fireScan = async (gymName: string, storeListingId: string | null) => {
      const res = await checkinsService.scan({
        gym_id: gymId,
        token: qrToken ?? undefined,
      });
      if (res.success) {
        // Streak is a nice-to-have — never block the success screen on it.
        let stats: StreakStats | null = null;
        try {
          const statsRes = await checkinsService.getMyDashboardStats();
          stats = statsRes.success ? ((statsRes.data as StreakStats | undefined) ?? null) : null;
        } catch {
          stats = null;
        }
        setOutcome({ state: "success", gymName, checkedInAt: res.data?.checked_in_at ?? null, stats });
        return;
      }

      const msg = (res.message || "").toLowerCase();
      if (msg.includes("already checked in")) {
        setOutcome({ state: "already", gymName });
      } else if (msg.includes("expired")) {
        // Token went stale between scan and check-in (e.g. a slow
        // first-time login) — same recovery as no token: scan again.
        setOutcome({ state: "scan_required", gymName });
      } else if (msg.includes("no active subscription")) {
        setOutcome({ state: "no_subscription", gymName, listingId: storeListingId });
      } else {
        setOutcome({
          state: "error",
          message: res.message || "Check-in failed. Please see the front desk.",
        });
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId, qrToken]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-10 flex justify-center">
          <BinecticsLockup />
        </div>

        {outcome.state === "working" && (
          <>
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-[3px] border-border-2 border-t-ink" />
            <h1 className="text-[22px] font-medium" style={{ color: "var(--ink)" }}>
              Checking you in…
            </h1>
          </>
        )}

        {outcome.state === "scan_required" && (
          <>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
              Scan the QR to check in.
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "var(--fg-2)" }}>
              This link can&rsquo;t check you in at{" "}
              <strong>{outcome.gymName}</strong>, check-ins need a live scan
              of the QR at the front desk, which refreshes every minute.
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <Link href="/check-in" className="btn-primary-v2" style={{ textDecoration: "none" }}>
                Open the scanner
              </Link>
              <Link href="/dashboard/member" className="btn-ghost-v2" style={{ textDecoration: "none" }}>
                Back to my dashboard
              </Link>
            </div>
          </>
        )}

        {/* Success is the dark takeover (owner ruling, Oct 2026); it
            portals over this page, which stays underneath, inert. */}
        {outcome.state === "success" && (
          <CheckInSuccess
            gymName={outcome.gymName}
            checkedInAt={outcome.checkedInAt}
            stats={outcome.stats}
            firstName={user?.first_name?.trim() || null}
            onDone={() => router.push("/dashboard/member")}
          />
        )}

        {outcome.state === "already" && (
          <>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
              Already counted.
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "var(--fg-2)" }}>
              You&rsquo;ve already checked in at <strong>{outcome.gymName}</strong>{" "}
              today, your streak is safe. Come back tomorrow!
            </p>
            <div className="mt-8">
              <Link href="/dashboard/member" className="btn-ghost-v2" style={{ textDecoration: "none" }}>
                Go to my dashboard
              </Link>
            </div>
          </>
        )}

        {outcome.state === "no_subscription" && (
          <>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "var(--danger-soft)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
              No active membership.
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "var(--fg-2)" }}>
              Your account doesn&rsquo;t have an active membership at{" "}
              <strong>{outcome.gymName}</strong>. The front desk has been
              notified and can help you sort it out.
            </p>
            <div className="mt-8 flex flex-col gap-2">
              {outcome.listingId && (
                <Link href={`/marketplace/${outcome.listingId}`} className="btn-primary-v2" style={{ textDecoration: "none" }}>
                  View membership plans
                </Link>
              )}
              <Link href="/dashboard/member/billing" className="btn-ghost-v2" style={{ textDecoration: "none" }}>
                My billing
              </Link>
            </div>
          </>
        )}

        {outcome.state === "error" && (
          <>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
              Check-in failed.
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "var(--fg-2)" }}>
              {outcome.message}
            </p>
            <div className="mt-8">
              <Link href="/dashboard/member" className="btn-ghost-v2" style={{ textDecoration: "none" }}>
                Go to my dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * "welcome back" only when the stats say this isn't the first visit; if the
 * stats read failed we don't know, so just the gym.
 */
function subtitleFor(gymName: string, stats: StreakStats | null): string {
  const total = stats?.total_check_ins;
  if (typeof total === "number" && total > 1) return `${gymName} · welcome back`;
  if (total === 1) return `${gymName} · your first check-in`;
  return gymName;
}

function clockOf(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * The dark check-in success (mosaic FlowBCheckin): "● CHECKED IN · 14:42",
 * "You're in, Tunde.", the gym, and the streak on a raised card. Every
 * figure is real: the time is the API's checked_in_at, the streak comes
 * from dashboard-stats after the scan, and "Personal best" appears only
 * when the API sends a longest streak (API #191) that this one has reached.
 */
function CheckInSuccess({
  gymName,
  checkedInAt,
  stats,
  firstName,
  onDone,
}: {
  gymName: string;
  checkedInAt: string | null;
  stats: StreakStats | null;
  firstName: string | null;
  onDone: () => void;
}) {
  const time = clockOf(checkedInAt);
  const streak = stats?.current_streak_days ?? 0;
  const best = stats ? isPersonalBest(stats) : false;
  return (
    <SuccessTakeover
      status={time ? `Checked in · ${time}` : "Checked in"}
      title={{ before: "You\u2019re ", emphasis: "in", after: firstName ? `, ${firstName}.` : "." }}
      subtitle={subtitleFor(gymName, stats)}
      titleAs="h1"
      primaryAction={{ label: "Done", onClick: onDone }}
      onDismiss={onDone}
    >
      {stats && streak > 0 && (
        <HeroStatCard
          surface="raised"
          align="center"
          eyebrow="Streak"
          value={streak}
          unit={dayUnit(streak)}
          footnote={best ? <span style={{ color: "var(--signal)" }}>Personal best</span> : (longestStreakLine(stats) ?? undefined)}
        />
      )}
    </SuccessTakeover>
  );
}
