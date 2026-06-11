"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { formatCurrency, getClientTimezone } from "@/utils/format";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  consultationsService,
  ConsultationProviderRole,
  type ConsultationSlot,
  type ConsultationType,
} from "@/lib/api/consultations";
import type { MarketplaceListing } from "@/lib/types";

const STEPS = ["Date & time", "Notes", "Confirm"];

function providerIdFromListing(l: MarketplaceListing): string {
  if (typeof l.professional_id === "string") return l.professional_id;
  return l.professional_id._id;
}

function providerName(l: MarketplaceListing): string {
  if (typeof l.organization_id === "object" && l.organization_id?.name) {
    return l.organization_id.name;
  }
  if (typeof l.professional_id === "object") {
    return `${l.professional_id.first_name} ${l.professional_id.last_name}`;
  }
  return l.headline;
}

function mapRole(accountType: string): ConsultationProviderRole | undefined {
  if (accountType === "personal_trainer") return ConsultationProviderRole.PERSONAL_TRAINER;
  if (accountType === "dietitian") return ConsultationProviderRole.DIETITIAN;
  return undefined;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDayLabel(date: Date): { dow: string; day: string; month: string } {
  return {
    dow: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
  };
}

function BookingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const initialTypeId = searchParams.get("consultationTypeId") ?? undefined;

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(initialTypeId);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(() => Boolean(listingId));
  const [metaError, setMetaError] = useState<string | null>(() =>
    listingId ? null : "Missing listing reference. Open a listing from the marketplace.",
  );

  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => isoDate(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    let isMounted = true;
    (async () => {
      try {
        const listingRes = await marketplaceService.getListingById(listingId);
        if (!isMounted) return;
        if (!listingRes.success || !listingRes.data) {
          setMetaError(listingRes.message ?? "Couldn't load listing");
          setLoadingMeta(false);
          return;
        }
        const l = listingRes.data;
        setListing(l);

        const typesRes = await consultationsService.getTypes();
        if (!isMounted) return;
        const role = mapRole(l.account_type);
        const filtered = (typesRes.data ?? []).filter((t) =>
          role ? t.providerRole === role : true,
        );
        setTypes(filtered);
        if (!initialTypeId && filtered[0]) setSelectedTypeId(filtered[0].id);
      } catch (err) {
        if (!isMounted) return;
        setMetaError(err instanceof Error ? err.message : "Couldn't load booking details");
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [listingId, initialTypeId]);

  const fetchSlots = useCallback(async () => {
    if (!listing || !selectedTypeId) return;
    await Promise.resolve();
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    try {
      const from = new Date(`${selectedDate}T00:00:00.000Z`);
      const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
      const res = await consultationsService.getProviderSlots(providerIdFromListing(listing), {
        consultationTypeId: selectedTypeId,
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
      });
      setSlots(res.data ?? []);
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : "Couldn't load slots");
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [listing, selectedTypeId, selectedDate]);

  useEffect(() => {
    if (!listing || !selectedTypeId) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await fetchSlots();
    })();
    return () => {
      cancelled = true;
    };
  }, [listing, selectedTypeId, selectedDate, fetchSlots]);

  const dateOptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const activeType = useMemo(
    () => types.find((t) => t.id === selectedTypeId) ?? null,
    [types, selectedTypeId],
  );

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(selectedSlot && selectedTypeId);
    if (step === 1) return true;
    return Boolean(selectedSlot && selectedTypeId && listing);
  }, [step, selectedSlot, selectedTypeId, listing]);

  const handleSubmit = async () => {
    if (!listing || !selectedTypeId || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await consultationsService.createBooking({
        providerId: providerIdFromListing(listing),
        consultationTypeId: selectedTypeId,
        startsAt: selectedSlot,
        clientTimezone: getClientTimezone(),
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        router.push("/dashboard/bookings");
      } else {
        setSubmitError(res.message ?? "Couldn't create booking");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === 2) {
      void handleSubmit();
      return;
    }
    if (canContinue) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (loadingMeta) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="h-6 w-6 border-2 border-solid border-t-transparent animate-spin rounded-full" style={{ borderColor: "var(--border-2)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (metaError || !listing) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-3" style={{ background: "var(--bg)" }}>
        <p className="text-[15px] font-medium" style={{ color: "var(--danger)" }}>Couldn&apos;t start booking</p>
        <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>{metaError ?? "Listing not found"}</p>
        <Link href="/marketplace" className="btn-ghost-v2 sm">Browse marketplace</Link>
      </div>
    );
  }

  const name = providerName(listing);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_380px]" style={{ background: "var(--bg)" }}>
      <main className="flex flex-col min-w-0">
        <div className="flex flex-col gap-0 px-5 sm:px-8 lg:px-14 pt-8 pb-30 max-w-[820px]">
          <div className="flex justify-between items-center pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href={`/marketplace/${listing._id}`} className="font-mono text-[11.5px] uppercase tracking-[0.05em] flex items-center gap-2 hover:text-ink" style={{ color: "var(--fg-3)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to {name}
            </Link>
            <Link href="/"><BinecticsLockup /></Link>
          </div>

          <div className="flex items-center my-9">
            {STEPS.map((s, i) => {
              const isDone = i < step;
              const isNow = i === step;
              return (
                <div key={s} className="flex items-center gap-2.5 flex-1" style={{ paddingRight: i < 2 ? "14px" : 0 }}>
                  <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px]" style={{ background: isDone || isNow ? "var(--ink)" : "var(--bg)", color: isDone || isNow ? "var(--bg)" : "var(--fg-3)", border: isDone || isNow ? "1px solid var(--ink)" : "1px solid var(--border-2)", fontVariantNumeric: "tabular-nums", transition: "all 200ms" }}>
                    {isDone ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg> : <span>{i + 1}</span>}
                  </div>
                  <span className="text-[12.5px] font-medium" style={{ color: isNow ? "var(--ink)" : "var(--fg-3)" }}>{s}</span>
                  {i < 2 && <div className="flex-1 h-px ml-1.5" style={{ background: "var(--border-2)" }} />}
                </div>
              );
            })}
          </div>

          {step === 0 && (
            <div>
              <h1 className="text-[32px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>When would you like to meet?</h1>
              <p className="text-[15px] mt-2.5 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
                {name}&apos;s open slots in your timezone ({getClientTimezone()}).
              </p>

              {types.length > 1 && (
                <div className="mt-8">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Session type</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {types.map((t) => {
                      const on = t.id === selectedTypeId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTypeId(t.id)}
                          className={`text-left p-4 px-4.5 rounded-(--r-3) cursor-pointer ${on ? "bg-bg-2" : "bg-bg"}`}
                          style={{ border: on ? "1px solid var(--ink)" : "1px solid var(--border)" }}
                        >
                          <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{t.name}</div>
                          <div className="text-[13px] mt-1 font-mono" style={{ color: "var(--fg-3)" }}>{t.defaultDurationMinutes} min</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Date · next 14 days</div>
                <div className="flex gap-1.5 overflow-x-auto pb-2">
                  {dateOptions.map((d) => {
                    const iso = isoDate(d);
                    const on = iso === selectedDate;
                    const lbl = formatDayLabel(d);
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setSelectedDate(iso)}
                        className="shrink-0 px-3 py-2 rounded-(--r-2) text-center cursor-pointer"
                        style={{
                          border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                          background: on ? "var(--ink)" : "var(--bg)",
                          color: on ? "var(--bg)" : "var(--ink)",
                          minWidth: "62px",
                        }}
                      >
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.04em]" style={{ color: on ? "oklch(0.75 0.005 85)" : "var(--fg-3)" }}>{lbl.dow}</div>
                        <div className="text-[16px] font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{lbl.day}</div>
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.04em]" style={{ color: on ? "oklch(0.75 0.005 85)" : "var(--fg-3)" }}>{lbl.month}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Available times</div>
                {slotsLoading ? (
                  <div className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>Loading slots...</div>
                ) : slotsError ? (
                  <div className="text-[13.5px]" style={{ color: "var(--danger)" }}>
                    {slotsError}
                    <button type="button" onClick={() => void fetchSlots()} className="btn-ghost-v2 sm ml-2">Try again</button>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>No availability on this day. Try another date.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const on = selectedSlot === s.startsAt;
                      const dis = !s.isAvailable;
                      return (
                        <button
                          key={s.startsAt}
                          type="button"
                          disabled={dis}
                          onClick={() => setSelectedSlot(s.startsAt)}
                          className={`px-2.5 py-3 rounded-(--r-2) text-center cursor-pointer ${dis ? "opacity-40 pointer-events-none" : ""}`}
                          style={{
                            border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                            background: on ? "var(--ink)" : "var(--bg)",
                            color: on ? "var(--bg)" : "var(--ink)",
                          }}
                        >
                          <div className="font-mono text-[13px] font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{formatTimeLabel(s.startsAt)}</div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.04em] mt-1" style={{ color: on ? "oklch(0.75 0.005 85)" : dis ? "var(--fg-4)" : "var(--fg-3)" }}>
                            {dis ? "Booked" : `${activeType?.defaultDurationMinutes ?? 60} min`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 rounded-(--r-2) p-3" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
                  <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    Need a fixed weekly slot? Set up recurring bookings.
                  </p>
                  <Link
                    href={`/booking/recurring?listingId=${listing._id}&consultationTypeId=${selectedTypeId ?? ""}&date=${selectedDate}`}
                    className="btn-ghost-v2 sm"
                  >
                    Recurring
                  </Link>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-[32px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>Anything {name} should know?</h1>
              <p className="text-[15px] mt-2.5 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
                Goals, injuries, preferences, or context for the session. Visible only to your provider.
              </p>
              <div className="mt-8">
                <label className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                  Notes <span className="font-mono text-[11px] uppercase tracking-[0.04em] font-normal ml-1.5" style={{ color: "var(--fg-3)" }}>Optional</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-(--r-2) px-3.5 py-3 text-[14px] mt-2 resize-y"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: "120px" }}
                  placeholder="Past injuries, goals, training preferences..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-[32px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>Confirm your booking</h1>
              <p className="text-[15px] mt-2.5 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
                Review the details below. {name} will be notified to confirm.
              </p>
              <div className="mt-8 rounded-(--r-3) p-5" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                <div className="flex flex-col gap-3 text-[13.5px]">
                  <Row k="Provider" v={name} />
                  <Row k="Session type" v={activeType?.name ?? "—"} />
                  <Row k="Duration" v={`${activeType?.defaultDurationMinutes ?? 60} min`} />
                  <Row
                    k="Starts at"
                    v={selectedSlot ? new Date(selectedSlot).toLocaleString(undefined, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  />
                  <Row k="Timezone" v={getClientTimezone()} />
                  {notes.trim() && <Row k="Notes" v={notes.trim()} />}
                </div>
              </div>
              <p className="text-[12.5px] mt-3.5 leading-relaxed" style={{ color: "var(--fg-3)" }}>
                Payment is handled separately once {name} confirms. You won&apos;t be charged at this step.
              </p>
              {submitError && (
                <div className="mt-3 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid oklch(0.92 0.05 25)" }}>
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between px-5 sm:px-8 lg:px-14 py-4.5" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <div className="font-mono text-[11.5px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
            Step <strong style={{ color: "var(--ink)" }}>{step + 1}</strong> of 3
          </div>
          <div className="flex gap-2">
            {step > 0 && <button type="button" onClick={goBack} className="btn-ghost-v2" disabled={submitting}>← Back</button>}
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue || submitting}
              className="btn-primary-v2 lg disabled:opacity-40"
            >
              {step === 2
                ? submitting
                  ? "Sending..."
                  : "Confirm booking →"
                : "Continue →"}
            </button>
          </div>
        </div>
      </main>

      <aside className="hidden lg:flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)", padding: "32px 28px" }}>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Your booking</div>

        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="aspect-[5/3] relative" style={{ background: "linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)" }}>
            <span className="absolute bottom-2.5 left-3 font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
              {listing.city ?? listing.country_code ?? "Online"}
            </span>
          </div>
          <div className="p-4">
            <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{name}</div>
            <div className="flex items-center gap-2 mt-1 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              <span className="inline-flex items-center gap-1 px-1.75 py-0.5 rounded-full border border-border font-mono text-[10px] uppercase" style={{ color: "var(--ink)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />{listing.average_rating?.toFixed(1) ?? "—"}
              </span>
              {listing.review_count ?? 0} reviews
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <Receipt k="Date" v={selectedSlot ? new Date(selectedSlot).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" }) : "—"} />
          <Receipt k="Time" v={selectedSlot ? formatTimeLabel(selectedSlot) : "—"} />
          <Receipt k="Type" v={activeType?.name ?? "—"} />
          <Receipt k="Duration" v={`${activeType?.defaultDurationMinutes ?? 60} min`} />
        </div>

        {listing.price_from && listing.currency && (
          <div className="flex flex-col">
            <div className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--fg-2)" }}>Session</span>
              <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(listing.price_from, listing.currency)}
              </span>
            </div>
            <div className="flex justify-between pt-3.5 font-medium">
              <span className="text-[14px]" style={{ color: "var(--ink)" }}>Due to provider</span>
              <span className="text-[17px]" style={{ color: "var(--ink)", letterSpacing: "-0.012em", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(listing.price_from, listing.currency)}
              </span>
            </div>
            <p className="text-[12px] mt-1.5" style={{ color: "var(--fg-3)" }}>
              Payment handled after confirmation.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 text-[12.5px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          {["Provider confirms within 24h", "Free cancellation up to 24h before", "You'll be notified on accept"].map((t) => (
            <div key={t} className="flex gap-2.5 items-start">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--signal-ink)" }}><path d="m5 12 5 5L20 7"/></svg>
              {t}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3.5">
      <span style={{ color: "var(--fg-3)" }}>{k}</span>
      <span className="font-mono font-medium text-right" style={{ color: "var(--ink)" }}>{v}</span>
    </div>
  );
}

function Receipt({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-2.5 text-[13px] gap-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--fg-2)" }}>{k}</span>
      <span className="font-mono font-medium text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
          <div className="h-6 w-6 border-2 border-solid border-t-transparent animate-spin rounded-full" style={{ borderColor: "var(--border-2)", borderTopColor: "transparent" }} />
        </div>
      }
    >
      <BookingPageInner />
    </Suspense>
  );
}
