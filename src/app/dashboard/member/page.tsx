"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { StatusPill } from "@/components/ds/StatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { checkinsService } from "@/lib/api/checkins";
import { consultationsService, ConsultationBookingStatus } from "@/lib/api/consultations";
import { loyaltyService } from "@/lib/api/loyalty";
import { progressService } from "@/lib/api/progress";
import type {
  ConsultationBooking,
} from "@/lib/api/consultations";
import type { WeightLog } from "@/lib/api/progress";
import type { LoyaltyBalance, MyCheckInDashboardStats } from "@/lib/types";

interface MemberSnapshot {
  checkins: MyCheckInDashboardStats | null;
  nextBooking: ConsultationBooking | null;
  loyalty: LoyaltyBalance | null;
  latestWeight: WeightLog | null;
}

function formatStartDate(iso: string) {
  const d = new Date(iso);
  const dow = d.toLocaleString(undefined, { weekday: "short" });
  const time = d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dow} ${time}`;
}

function formatLastCheckIn(iso?: string) {
  if (!iso) return "No check-ins yet";
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const cardStyle = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-3)",
  padding: 22,
};

export default function MemberHomePage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<MemberSnapshot>({
    checkins: null,
    nextBooking: null,
    loyalty: null,
    latestWeight: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const profilesPromise = progressService.getMyOwnProfiles();
        const [checkinsRes, bookingsRes, loyaltyRes, profilesRes] = await Promise.allSettled([
          checkinsService.getMyDashboardStats(),
          consultationsService.getMyBookings("upcoming"),
          loyaltyService.getBalance(),
          profilesPromise,
        ]);

        if (!isMounted) return;

        const checkins =
          checkinsRes.status === "fulfilled" ? (checkinsRes.value.data ?? null) : null;
        const upcoming =
          bookingsRes.status === "fulfilled" ? (bookingsRes.value.data ?? []) : [];
        const loyalty =
          loyaltyRes.status === "fulfilled" ? (loyaltyRes.value.data ?? null) : null;

        let latestWeight: WeightLog | null = null;
        if (profilesRes.status === "fulfilled") {
          const profileId = profilesRes.value.data?.[0]?._id;
          if (profileId) {
            try {
              const weightsRes = await progressService.getWeightLogs(profileId, 1);
              if (isMounted) latestWeight = weightsRes.data?.[0] ?? null;
            } catch {
              // Ignore weight fetch errors; treat as no log.
            }
          }
        }

        const nextBooking = upcoming
          .filter(
            (b) =>
              b.status === ConsultationBookingStatus.CONFIRMED ||
              b.status === ConsultationBookingStatus.PENDING,
          )
          .sort(
            (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          )[0] ?? null;

        if (isMounted) setSnapshot({ checkins, nextBooking, loyalty, latestWeight });
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

  const firstName = user?.first_name || "there";
  const today = new Date().toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <MemberDashboardShell activeLabel="Home">
      <div style={{ marginBottom: 18 }}>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {today}
          {user?.country_code ? ` · ${user.country_code}` : ""}
        </div>
        <h1
          style={{
            fontSize: 30,
            letterSpacing: "-0.024em",
            fontWeight: 500,
            marginTop: 6,
            color: "var(--ink)",
          }}
        >
          Hey, <em style={{ fontStyle: "italic" }}>{firstName}</em>.
        </h1>
      </div>

      {error && (
        <div
          className="rounded-(--r-3) p-4 mb-4 text-[13px]"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        <Kpi
          label="Streak"
          value={loading ? "—" : `${snapshot.checkins?.current_streak_days ?? 0} days`}
          delta={
            snapshot.checkins?.has_checked_in_today
              ? "Checked in today"
              : "Check in to grow it"
          }
          deltaColor={
            snapshot.checkins?.has_checked_in_today ? "var(--signal-ink)" : "var(--fg-3)"
          }
        />
        <Kpi
          label="Total check-ins"
          value={loading ? "—" : String(snapshot.checkins?.total_check_ins ?? 0)}
          delta={formatLastCheckIn(snapshot.checkins?.last_check_in_at)}
          deltaColor="var(--fg-3)"
        />
        <Kpi
          label="Next session"
          value={
            loading
              ? "—"
              : snapshot.nextBooking
                ? formatStartDate(snapshot.nextBooking.startsAt)
                : "None booked"
          }
          delta={
            snapshot.nextBooking
              ? snapshot.nextBooking.status === ConsultationBookingStatus.CONFIRMED
                ? "Confirmed"
                : "Pending"
              : "Book a session"
          }
          deltaColor="var(--fg-3)"
          small
        />
        <Kpi
          label="Latest weight"
          value={
            loading
              ? "—"
              : snapshot.latestWeight
                ? `${snapshot.latestWeight.weight_kg} kg`
                : "No log yet"
          }
          delta={
            snapshot.latestWeight
              ? new Date(snapshot.latestWeight.recorded_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "Log to track trend"
          }
          deltaColor="var(--fg-3)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3.5">
        <div>
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 14,
                color: "var(--ink)",
              }}
            >
              Next up
            </h3>
            {loading && (
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                Loading next session...
              </div>
            )}
            {!loading && !snapshot.nextBooking && (
              <div
                className="flex items-center justify-between gap-3 p-4 rounded-(--r-2)"
                style={{ background: "var(--bg-2)" }}
              >
                <div className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                  No upcoming sessions. Browse the marketplace to book one.
                </div>
                <Link href="/marketplace" className="btn-primary-v2 sm">
                  Browse
                </Link>
              </div>
            )}
            {!loading && snapshot.nextBooking && (
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  padding: 16,
                  background: "var(--bg-2)",
                  borderRadius: "var(--r-2)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--r-2)",
                    background:
                      "linear-gradient(135deg, oklch(0.85 0.05 60), oklch(0.72 0.08 40))",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}
                  >
                    Consultation &middot;{" "}
                    {Math.round(
                      (new Date(snapshot.nextBooking.endsAt).getTime() -
                        new Date(snapshot.nextBooking.startsAt).getTime()) /
                        60000,
                    )}{" "}
                    min
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--fg-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginTop: 3,
                    }}
                  >
                    {formatStartDate(snapshot.nextBooking.startsAt)} ·{" "}
                    {snapshot.nextBooking.clientTimezone}
                  </div>
                  <div className="mt-2">
                    <StatusPill
                      variant={
                        snapshot.nextBooking.status ===
                        ConsultationBookingStatus.CONFIRMED
                          ? "confirmed"
                          : "pending"
                      }
                      label={
                        snapshot.nextBooking.status ===
                        ConsultationBookingStatus.CONFIRMED
                          ? "Confirmed"
                          : "Pending"
                      }
                    />
                  </div>
                </div>
                <Link
                  href="/dashboard/bookings"
                  style={{
                    background: "var(--ink)",
                    color: "var(--bg)",
                    padding: "8px 14px",
                    borderRadius: "var(--r-2)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Details
                </Link>
              </div>
            )}
          </div>

          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <div className="flex items-center justify-between mb-3">
              <h3
                style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}
              >
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
            {!loading && !snapshot.loyalty && (
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                No loyalty activity yet. Start checking in to earn points.
              </div>
            )}
            {!loading && snapshot.loyalty && (
              <div className="flex items-baseline gap-3">
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 500,
                    color: "var(--ink)",
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {snapshot.loyalty.balance.toLocaleString()}
                </div>
                <div
                  className="font-mono text-[11px] uppercase"
                  style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}
                >
                  points
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={cardStyle}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 14,
                color: "var(--ink)",
              }}
            >
              Quick log
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/dashboard/member/weight-log", label: "Log weight" },
                { href: "/dashboard/member/meal-log", label: "Log meal" },
                { href: "/dashboard/member/workout-log", label: "Log workout" },
                { href: "/dashboard/bookings", label: "My bookings" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    padding: "8px 14px",
                    borderRadius: "var(--r-2)",
                    fontSize: 13,
                    color: "var(--ink)",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MemberDashboardShell>
  );
}

function Kpi({
  label,
  value,
  delta,
  deltaColor,
  small,
}: {
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
  small?: boolean;
}) {
  return (
    <div style={cardStyle}>
      <div
        className="font-mono"
        style={{
          fontSize: 10.5,
          color: "var(--fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: small ? 18 : 24,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          color: deltaColor,
          marginTop: 4,
        }}
      >
        {delta}
      </div>
    </div>
  );
}
