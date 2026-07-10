"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { useOrganization } from "@/contexts/OrganizationContext";
import { checkinsService, type CheckInRejection } from "@/lib/api/checkins";
import { CheckInHistoryPeriod, type CheckIn } from "@/lib/types";

const FEED_POLL_MS = 10_000;

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function personName(
  v: string | { first_name: string; last_name: string } | undefined | null,
) {
  return v && typeof v === "object" ? `${v.first_name} ${v.last_name}` : "—";
}

/**
 * The front-desk surface for QR check-ins: the gym's own QR (print it or
 * run this page full-screen at the desk) plus a live feed of today's
 * arrivals and bounced attempts. Replaces the old fabricated Devices page.
 */
export default function CheckInKioskPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrg?._id;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [rejections, setRejections] = useState<CheckInRejection[]>([]);
  const [loading, setLoading] = useState(true);
  const [kioskMode, setKioskMode] = useState(false);
  const [checkInUrl, setCheckInUrl] = useState<string>("");

  // The QR encodes this site's own /check-in/<ORGANIZATION id> URL — the
  // org is the operational entity; no marketplace listing required.
  useEffect(() => {
    const load = async () => {
      if (!orgId) return;
      const url = `${window.location.origin}/check-in/${orgId}`;
      setCheckInUrl(url);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 640,
        margin: 1,
        color: { dark: "#03314b", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setLoading(false);
    };
    void load();
  }, [orgId]);

  // Live desk feed, polled — a scan should show up within seconds.
  const refreshFeed = useCallback(async () => {
    if (!orgId) return;
    // period=today is a server-local day window — a UTC-sliced date string
    // here would show yesterday's feed for the first hours after local
    // midnight in UTC+ timezones.
    const [ins, rej] = await Promise.all([
      checkinsService.getOrgCheckIns(orgId, CheckInHistoryPeriod.TODAY),
      checkinsService.getOrgRejections(orgId),
    ]);
    if (ins.success && ins.data) setCheckIns(ins.data);
    if (rej.success && rej.data) setRejections(rej.data);
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const first = setTimeout(() => void refreshFeed(), 0);
    const id = setInterval(() => void refreshFeed(), FEED_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [orgId, refreshFeed]);

  // ── Full-screen kiosk display (front-desk tab) ────────────────
  if (kioskMode && qrDataUrl) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-8"
        style={{ background: "var(--bg)", zIndex: 60 }}
      >
        <div className="text-center">
          <div className="font-mono text-[12px] uppercase tracking-[0.08em]" style={{ color: "var(--fg-3)" }}>
            Check in at
          </div>
          <h1 className="mt-1 text-[34px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            {currentOrg?.name ?? "Your gym"}
          </h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Check-in QR code"
          className="w-[min(70vh,520px)] rounded-2xl border border-border bg-white p-6"
        />
        <p className="text-[15px]" style={{ color: "var(--fg-2)" }}>
          Scan with your phone camera to check in
        </p>
        <button
          type="button"
          onClick={() => setKioskMode(false)}
          className="fixed bottom-5 right-5 rounded-(--r-2) border border-border px-4 py-2 text-[13px]"
          style={{ background: "var(--bg)", color: "var(--fg-3)" }}
        >
          Exit kiosk mode
        </button>
      </div>
    );
  }

  return (
    <GymDashboardShell activeItem="Check-in kiosk" crumb="Check-in kiosk">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" style={{ marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.024em", fontWeight: 500, color: "var(--ink)" }}>
            Check-in kiosk
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            Members scan your gym&rsquo;s QR with their phone — arrivals and
            declined attempts land here live.
          </p>
        </div>
        {qrDataUrl && (
          <div className="flex gap-2">
            <a href={qrDataUrl} download="binectics-checkin-qr.png" className="btn-ghost-v2 sm" style={{ textDecoration: "none" }}>
              Download QR
            </a>
            <button type="button" className="btn-primary-v2 sm" onClick={() => setKioskMode(true)}>
              Open kiosk display
            </button>
          </div>
        )}
      </div>

      {!orgId && !orgLoading ? (
        <div className="rounded-(--r-2) border border-border bg-bg-2 p-5 text-sm" style={{ color: "var(--fg-2)" }}>
          Select an organization to generate its check-in QR.
        </div>
      ) : loading ? (
        <AsyncSpinner label="Loading kiosk" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
            {/* QR card */}
            <div className="rounded-xl border border-border bg-bg p-5 text-center" style={{ alignSelf: "start" }}>
              {qrDataUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qrDataUrl} alt="Check-in QR code" className="mx-auto w-full max-w-[260px] rounded-lg border border-border bg-white p-3" />
              )}
              <div className="mt-3 break-all font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>
                {checkInUrl}
              </div>
              <p className="mt-3 text-[12.5px] leading-normal" style={{ color: "var(--fg-3)" }}>
                Print it at the door, or run &ldquo;kiosk display&rdquo; on a
                front-desk tablet.
              </p>
            </div>

            {/* Live feed */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-bg p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                    Today&rsquo;s arrivals · {checkIns.length}
                  </h3>
                  <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.05em]" style={{ color: "var(--signal-ink)" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--signal)" }} />
                    Live
                  </span>
                </div>
                {checkIns.length === 0 ? (
                  <EmptySlate message="No check-ins yet today." mt="mt-0" />
                ) : (
                  <div className="flex flex-col">
                    {checkIns.slice(0, 12).map((ci) => (
                      <div key={ci._id} className="flex items-center justify-between border-b border-border py-2.5 text-[13.5px] last:border-b-0">
                        <span style={{ color: "var(--ink)" }}>{personName(ci.member_user_id as never)}</span>
                        <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{timeOf(ci.checked_in_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-bg p-5">
                <h3 className="mb-3" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                  Declined at the door
                </h3>
                {rejections.length === 0 ? (
                  <EmptySlate message="No declined attempts recently." mt="mt-0" />
                ) : (
                  <div className="flex flex-col">
                    {rejections.slice(0, 8).map((r) => (
                      <div key={r._id} className="flex items-center justify-between border-b border-border py-2.5 text-[13.5px] last:border-b-0">
                        <span style={{ color: "var(--ink)" }}>{personName(r.member_user_id)}</span>
                        <span className="flex items-center gap-3">
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em]"
                            style={
                              r.reason === "no_subscription"
                                ? { background: "var(--danger-soft)", color: "var(--danger)" }
                                : { background: "var(--bg-2)", color: "var(--fg-3)" }
                            }
                          >
                            {r.reason === "no_subscription" ? "No membership" : "Duplicate"}
                          </span>
                          <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{timeOf(r.attempted_at)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </GymDashboardShell>
  );
}
