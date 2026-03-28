"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import QRCode from "qrcode";
import { useOrganization } from "@/contexts/OrganizationContext";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";
import { CheckInHistoryPeriod, type CheckIn } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getMemberName(checkIn: CheckIn): string {
  if (
    typeof checkIn.member_user_id === "object" &&
    checkIn.member_user_id !== null
  ) {
    return `${checkIn.member_user_id.first_name} ${checkIn.member_user_id.last_name}`;
  }
  return "Unknown Member";
}

function getMemberInitials(checkIn: CheckIn): string {
  if (
    typeof checkIn.member_user_id === "object" &&
    checkIn.member_user_id !== null
  ) {
    return `${checkIn.member_user_id.first_name.charAt(0)}${checkIn.member_user_id.last_name.charAt(0)}`;
  }
  return "?";
}

function getMemberEmail(checkIn: CheckIn): string {
  if (
    typeof checkIn.member_user_id === "object" &&
    checkIn.member_user_id !== null
  ) {
    return checkIn.member_user_id.email;
  }
  return "";
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────

export default function GymOwnerCheckInsPage() {
  const { currentOrg } = useOrganization();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [listingId, setListingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch the org's marketplace listing to get the correct listing ID for QR
  useEffect(() => {
    if (!currentOrg) return;
    let mounted = true;
    async function fetchListing() {
      try {
        const res = await marketplaceService.getOrgListing(currentOrg!._id);
        if (mounted && res.success && res.data) {
          setListingId(res.data._id);
        }
      } catch {
        // Listing may not exist yet
      }
    }
    void fetchListing();
    return () => {
      mounted = false;
    };
  }, [currentOrg]);

  // Generate the check-in URL using the listing ID (not org ID)
  const checkInUrl =
    typeof window !== "undefined" && listingId
      ? `${window.location.origin}/check-in/${listingId}`
      : "";

  // Render QR code whenever the URL is ready
  useEffect(() => {
    if (!checkInUrl || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, checkInUrl, {
      width: 256,
      margin: 2,
      color: { dark: "#03314B", light: "#FFFFFF" },
    }).catch((err) => console.error("QR canvas error", err));

    QRCode.toDataURL(checkInUrl, { width: 512 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR dataURL error", err));
  }, [checkInUrl]);

  const loadCheckIns = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const periodMap = {
        today: CheckInHistoryPeriod.TODAY,
        week: CheckInHistoryPeriod.WEEK,
        month: CheckInHistoryPeriod.MONTH,
      } as const;

      const res = await checkinsService.getOrgCheckIns(
        currentOrg._id,
        periodMap[selectedPeriod],
      );
      if (res.success && res.data) {
        setCheckIns(res.data);
      }
    } catch {
      // silently fail — empty state shown
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, selectedPeriod]);

  useEffect(() => {
    window.setTimeout(() => void loadCheckIns(), 0);
  }, [loadCheckIns]);

  const loadStats = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const [todayRes, weekRes, monthRes] = await Promise.all([
        checkinsService.getOrgCheckIns(
          currentOrg._id,
          CheckInHistoryPeriod.TODAY,
        ),
        checkinsService.getOrgCheckIns(
          currentOrg._id,
          CheckInHistoryPeriod.WEEK,
        ),
        checkinsService.getOrgCheckIns(
          currentOrg._id,
          CheckInHistoryPeriod.MONTH,
        ),
      ]);

      setStats({
        today: todayRes.success && todayRes.data ? todayRes.data.length : 0,
        week: weekRes.success && weekRes.data ? weekRes.data.length : 0,
        month: monthRes.success && monthRes.data ? monthRes.data.length : 0,
      });
    } catch {
      setStats({ today: 0, week: 0, month: 0 });
    }
  }, [currentOrg]);

  useEffect(() => {
    window.setTimeout(() => void loadStats(), 0);
  }, [loadStats]);

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = "gym-checkin-qr-code.png";
    link.href = qrDataUrl;
    link.click();
  };

  // Stats derived from loaded data
  const todayCount = stats.today;
  const weekCount = stats.week;
  const monthCount = stats.month;

  // Most recent check-in for "Last Check-in" stat
  const lastCheckIn =
    checkIns.length > 0 ? formatTime(checkIns[0].checked_in_at) : "—";

  if (!currentOrg) {
    return (
      <div className="flex min-h-screen bg-background">
        <GymOwnerSidebar />
        <main className="md:ml-64 flex-1 flex items-center justify-center">
          <p className="text-foreground/60">
            Select an organisation to continue.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">
              QR Check-ins
            </h1>
            <p className="text-foreground/60 mt-1">
              Track member attendance and gym traffic
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Today&apos;s Check-ins
              </p>
              {isLoading ? (
                <div className="h-9 w-16 bg-neutral-100 animate-pulse rounded mt-2" />
              ) : (
                <p className="text-3xl font-black text-foreground mt-2">
                  {todayCount}
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                This Week
              </p>
              {isLoading ? (
                <div className="h-9 w-16 bg-neutral-100 animate-pulse rounded mt-2" />
              ) : (
                <p className="text-3xl font-black text-foreground mt-2">
                  {weekCount}
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                This Month
              </p>
              {isLoading ? (
                <div className="h-9 w-16 bg-neutral-100 animate-pulse rounded mt-2" />
              ) : (
                <p className="text-3xl font-black text-foreground mt-2">
                  {monthCount}
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Last Check-in
              </p>
              {isLoading ? (
                <div className="h-9 w-20 bg-neutral-100 animate-pulse rounded mt-2" />
              ) : (
                <p className="text-3xl font-black text-foreground mt-2">
                  {lastCheckIn}
                </p>
              )}
            </div>
          </div>

          {/* QR Code Section + Recent Check-ins */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* QR Card */}
            <div className="bg-accent-blue-50 border-2 border-accent-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Your Gym QR Code
              </h3>
              <div className="bg-white rounded-lg p-6 flex items-center justify-center mb-4">
                <canvas ref={canvasRef} />
              </div>
              <p className="text-sm text-foreground/60 text-center mb-4">
                Members scan this code to check in to your gym
              </p>
              <div className="space-y-2">
                <button
                  onClick={downloadQRCode}
                  disabled={!qrDataUrl}
                  className="w-full px-4 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download QR Code
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-3 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print QR Code
                </button>
              </div>
              {checkInUrl && (
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-xs font-semibold text-foreground/70 mb-1">
                    Check-in URL:
                  </p>
                  <p className="text-xs text-foreground/60 break-all">
                    {checkInUrl}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Check-ins */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Recent Check-ins
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
                        <div className="h-3 bg-neutral-100 rounded w-20 animate-pulse" />
                      </div>
                      <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : checkIns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-foreground/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-foreground/60 font-medium">
                    No check-ins yet
                  </p>
                  <p className="text-sm text-foreground/40 mt-1">
                    Share the QR code with your members to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {checkIns.slice(0, 20).map((checkIn) => (
                    <div
                      key={checkIn._id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getMemberInitials(checkIn)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {getMemberName(checkIn)}
                          </p>
                          <p className="text-sm text-foreground/60">
                            {getMemberEmail(checkIn)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatTime(checkIn.checked_in_at)}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {formatDate(checkIn.checked_in_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Check-in History with period filter */}
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-foreground">
                Check-in History
              </h3>
              <div className="flex gap-2">
                {(["today", "week", "month"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? "bg-accent-blue-500 text-white"
                        : "bg-neutral-100 text-foreground hover:bg-neutral-200"
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : checkIns.length === 0 ? (
              <div className="text-center py-10 text-foreground/50">
                No check-ins in this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-foreground/70">
                        Member
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground/70">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground/70">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground/70">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {checkIns.map((checkIn) => (
                      <tr
                        key={checkIn._id}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-foreground">
                          {getMemberName(checkIn)}
                        </td>
                        <td className="py-3 px-4 text-foreground/60">
                          {getMemberEmail(checkIn)}
                        </td>
                        <td className="py-3 px-4 text-foreground/70">
                          {formatDate(checkIn.checked_in_at)}
                        </td>
                        <td className="py-3 px-4 text-foreground/70">
                          {formatTime(checkIn.checked_in_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
