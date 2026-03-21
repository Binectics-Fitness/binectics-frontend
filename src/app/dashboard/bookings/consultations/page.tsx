"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  consultationsService,
  type ConsultationSlot,
  type ConsultationType,
} from "@/lib/api/consultations";
import {
  dualTimezoneLabel,
  formatLocal,
  getClientTimezone,
} from "@/utils/format";

export default function ConsultationBookingPage() {
  const { isAuthenticated, isLoading } = useRequireAuth();

  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [providerId, setProviderId] = useState("");
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ConsultationSlot | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<null | {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    consultationsService.getTypes().then((res) => {
      if (res.success && res.data) {
        setTypes(res.data);
        if (res.data[0]) {
          setSelectedTypeId(res.data[0].id);
        }
      }
    });
  }, []);

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.isAvailable),
    [slots],
  );

  const loadSlots = async () => {
    if (!providerId || !selectedTypeId) {
      setError("Enter provider ID and consultation type first.");
      return;
    }

    setLoadingSlots(true);
    setError(null);

    const dateFrom = new Date().toISOString().slice(0, 10);
    const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const res = await consultationsService.getProviderSlots(providerId, {
      consultationTypeId: selectedTypeId,
      dateFrom,
      dateTo,
    });

    if (res.success && res.data) {
      setSlots(res.data);
    } else {
      setError(res.message ?? "Failed to load slots.");
    }

    setLoadingSlots(false);
  };

  const bookSlot = async () => {
    if (!selectedSlot || !providerId || !selectedTypeId) {
      setError("Select a slot first.");
      return;
    }

    setError(null);

    const res = await consultationsService.createBooking({
      providerId,
      consultationTypeId: selectedTypeId,
      startsAt: selectedSlot.startsAt,
      clientTimezone: getClientTimezone(),
      notes: notes || undefined,
    });

    if (res.success && res.data) {
      setBooking({
        id: res.data.id,
        startsAt: res.data.startsAt,
        endsAt: res.data.endsAt,
        status: res.data.status,
      });
    } else {
      setError(res.message ?? "Booking failed.");
    }
  };

  if (isLoading) return <DashboardLoading />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-foreground">
            Book Consultation
          </h1>
          <p className="mt-2 text-foreground-secondary">
            Select a provider, pick a slot, and book your consultation.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {booking && (
          <div className="mb-6 rounded-lg bg-primary-100 px-4 py-3 text-sm text-foreground">
            Booking confirmed ({booking.status}) —{" "}
            {formatLocal(booking.startsAt, "EEE, MMM d • h:mm a")}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Booking Details
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="text"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="Provider ID"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />

            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Select Consultation Type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadSlots}
              disabled={loadingSlots}
              className="rounded-lg bg-accent-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSlots ? "Loading..." : "Load Slots"}
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Available Slots (Next 7 Days)
          </h2>

          {availableSlots.length === 0 ? (
            <p className="text-sm text-foreground-secondary">
              No slots loaded yet.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot?.startsAt === slot.startsAt;
                return (
                  <button
                    key={slot.startsAt}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm ${
                      isSelected
                        ? "border-primary-500 bg-primary-100"
                        : "border-neutral-300"
                    }`}
                  >
                    <p className="font-semibold text-foreground">
                      {dualTimezoneLabel(
                        slot.startsAt,
                        slot.endsAt,
                        slot.providerTimezone,
                      )}
                    </p>
                    <p className="text-xs text-foreground-secondary">
                      Provider TZ: {slot.providerTimezone}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Confirm Booking
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note for the provider"
            rows={3}
            className="mb-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            onClick={bookSlot}
            disabled={!selectedSlot}
            className="rounded-lg bg-primary-500 px-5 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Book Selected Slot
          </button>
        </section>
      </main>
    </div>
  );
}
