"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { AsyncSpinner } from "@/components/ds";
import SearchableSelect from "@/components/SearchableSelect";
import { formatCurrency, getClientTimezone } from "@/utils/format";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  consultationsService,
  ConsultationProviderRole,
  type ConsultationType,
} from "@/lib/api/consultations";
import type { MarketplaceListing } from "@/lib/types";

enum RecurrenceCadence {
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
}

enum RecurrenceEndMode {
  AFTER_COUNT = "AFTER_COUNT",
}

const CADENCE_OPTIONS: Array<{ label: string; value: RecurrenceCadence }> = [
  { label: "Every week", value: RecurrenceCadence.WEEKLY },
  { label: "Every 2 weeks", value: RecurrenceCadence.BIWEEKLY },
  { label: "Every month", value: RecurrenceCadence.MONTHLY },
];

const COUNT_OPTIONS = [
  { label: "After 4 sessions", value: "4" },
  { label: "After 8 sessions", value: "8" },
  { label: "After 12 sessions", value: "12" },
  { label: "After 24 sessions", value: "24" },
];

const DAY_OPTIONS = [
  { label: "Sunday", value: "0" },
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
];

function providerIdFromListing(listing: MarketplaceListing): string {
  if (typeof listing.professional_id === "string") return listing.professional_id;
  return listing.professional_id._id;
}

function providerName(listing: MarketplaceListing): string {
  if (typeof listing.organization_id === "object" && listing.organization_id?.name) {
    return listing.organization_id.name;
  }
  if (typeof listing.professional_id === "object") {
    return `${listing.professional_id.first_name} ${listing.professional_id.last_name}`;
  }
  return listing.headline;
}

function mapRole(accountType: string): ConsultationProviderRole | undefined {
  if (accountType === "personal_trainer") return ConsultationProviderRole.PERSONAL_TRAINER;
  if (accountType === "dietitian") return ConsultationProviderRole.DIETITIAN;
  return undefined;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextOrSameWeekday(base: Date, targetWeekday: number): Date {
  const date = new Date(base);
  const diff = (targetWeekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
}

/**
 * Advance one calendar month, clamping to the last valid day so month-end
 * dates don't overflow (e.g. Jan 31 -> Feb 28, not Mar 3).
 */
function addCalendarMonth(date: Date): Date {
  const day = date.getDate();
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  const daysInTargetMonth = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate();
  next.setDate(Math.min(day, daysInTargetMonth));
  return next;
}

function addByCadence(date: Date, cadence: RecurrenceCadence): Date {
  const next = new Date(date);
  if (cadence === RecurrenceCadence.WEEKLY) {
    next.setDate(next.getDate() + 7);
    return next;
  }
  if (cadence === RecurrenceCadence.BIWEEKLY) {
    next.setDate(next.getDate() + 14);
    return next;
  }
  return addCalendarMonth(next);
}

function formatOccurrenceLabel(date: Date, hour: number, minute: number): string {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecurringBookingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingId = searchParams.get("listingId");
  const initialTypeId = searchParams.get("consultationTypeId") ?? undefined;
  const initialDate = searchParams.get("date") ?? toYmd(new Date());

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(initialTypeId);

  const [loadingMeta, setLoadingMeta] = useState<boolean>(() => Boolean(listingId));
  const [metaError, setMetaError] = useState<string | null>(() =>
    listingId ? null : "Missing listing reference. Open booking from a listing.",
  );

  const [startDate, setStartDate] = useState(initialDate);
  // Parse as local midnight to match occurrence generation (`${date}T00:00:00`).
  // `new Date("YYYY-MM-DD")` parses as UTC, which reads back as the previous day
  // for users west of UTC and disagrees with the generated occurrences.
  const [weekday, setWeekday] = useState<string>(() => String(new Date(`${initialDate}T00:00:00`).getDay()));
  const [cadence, setCadence] = useState<RecurrenceCadence>(RecurrenceCadence.WEEKLY);
  const [endMode] = useState<RecurrenceEndMode>(RecurrenceEndMode.AFTER_COUNT);
  const [sessionCount, setSessionCount] = useState("12");
  const [time, setTime] = useState("08:30");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSummary, setSubmitSummary] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    if (!listingId) return;
    let mounted = true;

    (async () => {
      try {
        const listingRes = await marketplaceService.getListingById(listingId);
        if (!mounted) return;

        if (!listingRes.success || !listingRes.data) {
          setMetaError(listingRes.message ?? "Could not load listing");
          setLoadingMeta(false);
          return;
        }

        const fetchedListing = listingRes.data;
        setListing(fetchedListing);

        const typesRes = await consultationsService.getTypes();
        if (!mounted) return;

        const role = mapRole(fetchedListing.account_type);
        const filtered = (typesRes.data ?? []).filter((t) =>
          role ? t.providerRole === role : true,
        );
        setTypes(filtered);
        if (!selectedTypeId && filtered[0]) {
          setSelectedTypeId(filtered[0].id);
        }
      } catch (error) {
        if (!mounted) return;
        setMetaError(error instanceof Error ? error.message : "Could not load booking details");
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [listingId, selectedTypeId]);

  const occurrences = useMemo(() => {
    const count = Number.parseInt(sessionCount, 10);
    if (!Number.isFinite(count) || count <= 0) return [] as Date[];

    // Monthly recurs on the selected calendar date; weekly/biweekly snap to the
    // chosen day of week.
    const base = new Date(`${startDate}T00:00:00`);
    const start =
      cadence === RecurrenceCadence.MONTHLY
        ? base
        : nextOrSameWeekday(base, Number(weekday));
    const list: Date[] = [];

    let current = new Date(start);
    for (let i = 0; i < count; i += 1) {
      list.push(new Date(current));
      current = addByCadence(current, cadence);
    }

    return list;
  }, [sessionCount, startDate, weekday, cadence]);

  const [hour, minute] = useMemo(() => {
    const [h, m] = time.split(":");
    return [Number(h), Number(m)];
  }, [time]);

  const timeOptions = useMemo(() => {
    const options = [
      { label: "06:00", value: "06:00" },
      { label: "07:00", value: "07:00" },
      { label: "08:30", value: "08:30" },
      { label: "10:00", value: "10:00" },
      { label: "17:00", value: "17:00" },
      { label: "18:00", value: "18:00" },
    ];
    return options;
  }, []);

  const totalAmount = useMemo(() => {
    const unit = listing?.price_from ?? 0;
    return unit * occurrences.length;
  }, [listing?.price_from, occurrences.length]);

  const canSubmit = Boolean(
    listing && selectedTypeId && occurrences.length > 0 && Number.isFinite(hour) && Number.isFinite(minute),
  );

  const handleCreateRecurring = async () => {
    if (!listing || !selectedTypeId || !canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSummary(null);

    let success = 0;
    let failed = 0;

    for (const date of occurrences) {
      const startsAt = new Date(date);
      startsAt.setHours(hour, minute, 0, 0);

      try {
        const res = await consultationsService.createBooking({
          providerId: providerIdFromListing(listing),
          consultationTypeId: selectedTypeId,
          startsAt: startsAt.toISOString(),
          clientTimezone: getClientTimezone(),
          notes: notes.trim() || undefined,
        });

        if (res.success) success += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    setSubmitting(false);

    if (success > 0) {
      setSubmitSummary({ success, failed });
      if (failed === 0) {
        router.push("/dashboard/bookings");
      }
      return;
    }

    setSubmitError("Could not create recurring bookings. Please try another slot or cadence.");
  };

  if (loadingMeta) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <AsyncSpinner size="page" label="Loading booking" />
      </div>
    );
  }

  if (metaError || !listing) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-3" style={{ background: "var(--bg)" }}>
        <p className="text-[15px] font-medium" style={{ color: "var(--danger)" }}>Could not start recurring booking</p>
        <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>{metaError ?? "Listing not found"}</p>
        <Link href="/marketplace" className="btn-ghost-v2 sm">Browse marketplace</Link>
      </div>
    );
  }

  const name = providerName(listing);
  const unitPrice = listing.price_from ?? 0;
  const currency = listing.currency ?? "ZAR";

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-3 text-[13px]">
            <Link href={`/booking?listingId=${listing._id}&consultationTypeId=${selectedTypeId ?? ""}`} className="btn-ghost-v2 sm">One-time booking</Link>
            <Link href="/dashboard/bookings" className="btn-primary-v2 sm">My bookings</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-150 px-5 sm:px-6 py-8">
        <div className="rounded-(--r-3) p-8 sm:p-9" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>
            Recurring · with {name}
          </div>
          <h1 className="text-[26px] sm:text-[28px] font-medium leading-[1.2] mb-3" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            Set up a recurring schedule.
          </h1>
          <p className="text-[15px] leading-[1.6] mb-7" style={{ color: "var(--fg-2)" }}>
            We will create each booking now using your selected cadence. You can cancel individual sessions later.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Session type</label>
              <SearchableSelect
                value={selectedTypeId ?? ""}
                onChange={setSelectedTypeId}
                options={types.map((t) => ({ label: `${t.name} · ${t.defaultDurationMinutes} min`, value: t.id }))}
                placeholder="Select type"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Cadence</label>
              <SearchableSelect
                value={cadence}
                onChange={(value) => setCadence(value as RecurrenceCadence)}
                options={CADENCE_OPTIONS}
                placeholder="Select cadence"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-(--r-2) px-3.5 py-2.75 text-[14px] outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border-2)", font: "inherit" }}
              />
            </div>

            {cadence !== RecurrenceCadence.MONTHLY && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Day of week</label>
                <SearchableSelect
                  value={weekday}
                  onChange={setWeekday}
                  options={DAY_OPTIONS}
                  placeholder="Select day"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Time</label>
              <SearchableSelect
                value={time}
                onChange={setTime}
                options={timeOptions}
                placeholder="Select time"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Ends</label>
              <SearchableSelect
                value={sessionCount}
                onChange={setSessionCount}
                options={COUNT_OPTIONS}
                placeholder="Select number of sessions"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-4">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-(--r-2) px-3.5 py-3 text-[14px] resize-y"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", minHeight: 88 }}
              placeholder="Goals, injuries, or preferences for all sessions"
            />
          </div>

          <div className="rounded-(--r-3) p-4.5 mt-5" style={{ background: "var(--bg-2)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mb-2.5" style={{ color: "var(--fg-3)" }}>Schedule preview</div>
            {occurrences.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>Select a valid cadence and session count.</div>
            ) : (
              occurrences.slice(0, 12).map((date, index) => (
                <div key={`${date.toISOString()}-${index}`} className="flex justify-between py-0.75 font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>
                  <span>{formatOccurrenceLabel(date, hour, minute)}</span>
                  <span style={{ color: "var(--signal-ink)" }}>{index + 1} of {occurrences.length}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4">
            <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              {endMode === RecurrenceEndMode.AFTER_COUNT ? "Total" : "Estimate"} · {" "}
              <strong className="font-mono font-medium" style={{ color: "var(--ink)" }}>
                {formatCurrency(totalAmount, currency)}
              </strong>{" "}
              ({formatCurrency(unitPrice, currency)} × {occurrences.length})
            </div>
            <button
              type="button"
              className="btn-primary-v2 lg cursor-pointer disabled:opacity-40"
              disabled={!canSubmit || submitting}
              onClick={() => void handleCreateRecurring()}
            >
              {submitting ? "Creating bookings..." : "Create recurring bookings"}
            </button>
          </div>

          {submitError && (
            <div className="mt-3 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid oklch(0.92 0.05 25)" }}>
              {submitError}
            </div>
          )}

          {submitSummary && submitSummary.failed > 0 && (
            <div className="mt-3 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-2)", color: "var(--ink)", border: "1px solid var(--border)" }}>
              Created {submitSummary.success} booking{submitSummary.success === 1 ? "" : "s"}; failed {submitSummary.failed}. You can retry with a different time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecurringBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
          <AsyncSpinner size="page" label="Loading booking" />
        </div>
      }
    >
      <RecurringBookingInner />
    </Suspense>
  );
}
