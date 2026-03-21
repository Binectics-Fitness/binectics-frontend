"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  consultationsService,
  ConsultationProviderRole,
  type ConsultationSlot,
  type ConsultationType,
} from "@/lib/api/consultations";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import {
  dualTimezoneLabel,
  formatLocal,
  getClientTimezone,
} from "@/utils/format";

function ConsultationBookingPageContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const prefilledProviderId = searchParams.get("providerId") ?? "";
  const prefilledProviderName = searchParams.get("providerName") ?? "";
  const prefilledProviderRole = searchParams.get("providerRole") ?? "";
  const isPrefilledProvider = prefilledProviderId.length > 0;

  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [providerId, setProviderId] = useState(prefilledProviderId);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ConsultationSlot | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<null | {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const inferProviderRoleFromName = useCallback(
    (roleName?: string | null): ConsultationProviderRole | undefined => {
      if (!roleName) return undefined;
      const normalized = roleName.toLowerCase();
      if (normalized.includes("diet"))
        return ConsultationProviderRole.DIETITIAN;
      if (normalized.includes("trainer"))
        return ConsultationProviderRole.PERSONAL_TRAINER;
      return ConsultationProviderRole.OTHER;
    },
    [],
  );

  const inferProviderRoleFromProfile = useCallback(
    (profile: ClientProfile): ConsultationProviderRole | undefined => {
      if (typeof profile.professional_id !== "object") return undefined;
      return inferProviderRoleFromName(
        profile.professional_id.user_role?.role?.name,
      );
    },
    [inferProviderRoleFromName],
  );

  const connectedProviders = useMemo(() => {
    const unique = new Map<
      string,
      {
        id: string;
        name: string;
        role?: ConsultationProviderRole;
      }
    >();

    for (const profile of profiles) {
      if (typeof profile.professional_id !== "object") continue;
      const provider = profile.professional_id;
      const id = provider._id;
      if (!id) continue;

      if (!unique.has(id)) {
        unique.set(id, {
          id,
          name:
            `${provider.first_name} ${provider.last_name}`.trim() ||
            provider.email ||
            "Provider",
          role: inferProviderRoleFromProfile(profile),
        });
      }
    }

    return Array.from(unique.values());
  }, [inferProviderRoleFromProfile, profiles]);

  const selectedProvider = useMemo(
    () => connectedProviders.find((provider) => provider.id === providerId),
    [connectedProviders, providerId],
  );

  const selectedProviderRole =
    selectedProvider?.role ??
    inferProviderRoleFromName(prefilledProviderRole) ??
    undefined;

  const filteredTypes = useMemo(() => {
    if (!selectedProviderRole) return types;
    return types.filter((type) => type.providerRole === selectedProviderRole);
  }, [selectedProviderRole, types]);

  const selectedType = useMemo(
    () => filteredTypes.find((type) => type.id === selectedTypeId) ?? null,
    [filteredTypes, selectedTypeId],
  );

  useEffect(() => {
    let mounted = true;

    async function loadLinkedProviders() {
      setLoadingProviders(true);
      const response = await progressService.getMyOwnProfiles();

      if (!mounted) return;
      if (response.success && response.data) {
        setProfiles(response.data);
      }

      setLoadingProviders(false);
    }

    loadLinkedProviders();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    consultationsService.getTypes().then((res) => {
      if (res.success && res.data) {
        setTypes(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (!connectedProviders.length) {
      const handle = setTimeout(() => {
        setProviderId(prefilledProviderId);
      }, 0);
      return () => clearTimeout(handle);
    }

    if (prefilledProviderId) {
      const prefilledExists = connectedProviders.some(
        (provider) => provider.id === prefilledProviderId,
      );
      if (prefilledExists) {
        const handle = setTimeout(() => {
          setProviderId(prefilledProviderId);
        }, 0);
        return () => clearTimeout(handle);
      }
    }

    const handle = setTimeout(() => {
      setProviderId(connectedProviders[0].id);
    }, 0);
    return () => clearTimeout(handle);
  }, [connectedProviders, prefilledProviderId]);

  useEffect(() => {
    if (!filteredTypes.length) {
      const handle = setTimeout(() => {
        setSelectedTypeId("");
      }, 0);
      return () => clearTimeout(handle);
    }

    const stillValid = filteredTypes.some((type) => type.id === selectedTypeId);
    if (!stillValid) {
      const handle = setTimeout(() => {
        setSelectedTypeId(filteredTypes[0].id);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [filteredTypes, selectedTypeId]);

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.isAvailable),
    [slots],
  );

  const slotDates = useMemo(() => {
    const dates = new Map<
      string,
      {
        key: string;
        label: string;
      }
    >();

    for (const slot of availableSlots) {
      const key = formatLocal(slot.startsAt, "yyyy-MM-dd");
      if (!dates.has(key)) {
        dates.set(key, {
          key,
          label: formatLocal(slot.startsAt, "EEE, MMM d"),
        });
      }
    }

    return Array.from(dates.values());
  }, [availableSlots]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return availableSlots.filter(
      (slot) => formatLocal(slot.startsAt, "yyyy-MM-dd") === selectedDate,
    );
  }, [availableSlots, selectedDate]);

  const loadSlots = useCallback(async () => {
    if (!providerId || !selectedTypeId) {
      setError("Select a provider and consultation type first.");
      return;
    }

    setLoadingSlots(true);
    setError(null);
    setSelectedSlot(null);

    const dateFrom = new Date().toISOString().slice(0, 10);
    const dateTo = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const res = await consultationsService.getProviderSlots(providerId, {
      consultationTypeId: selectedTypeId,
      dateFrom,
      dateTo,
    });

    if (res.success && res.data) {
      setSlots(res.data);
      const firstAvailable = res.data.find((slot) => slot.isAvailable);
      setSelectedDate(
        firstAvailable
          ? formatLocal(firstAvailable.startsAt, "yyyy-MM-dd")
          : "",
      );
    } else {
      setError(res.message ?? "Failed to load slots.");
      setSlots([]);
      setSelectedDate("");
    }

    setLoadingSlots(false);
  }, [
    providerId,
    selectedTypeId,
    setError,
    setLoadingSlots,
    setSelectedSlot,
    setSlots,
    setSelectedDate,
  ]);

  useEffect(() => {
    if (!providerId || !selectedTypeId) return;

    if (!isPrefilledProvider && connectedProviders.length > 0) {
      const handle = setTimeout(() => {
        void loadSlots();
      }, 0);
      return () => clearTimeout(handle);
    }

    if (!isPrefilledProvider) return;
    if (!providerId || !selectedTypeId) return;
    const handle = setTimeout(() => {
      void loadSlots();
    }, 0);
    return () => clearTimeout(handle);
  }, [
    connectedProviders.length,
    isPrefilledProvider,
    providerId,
    selectedTypeId,
    loadSlots,
  ]);

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
            Choose from your connected providers, then pick a date and time from
            their availability.
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
            {loadingProviders ? (
              <div className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-foreground-secondary">
                Loading connected providers...
              </div>
            ) : connectedProviders.length > 0 ? (
              <select
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {connectedProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                    {provider.role ? ` (${provider.role})` : ""}
                  </option>
                ))}
              </select>
            ) : isPrefilledProvider ? (
              <div className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
                  Provider
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {prefilledProviderName || "Selected provider"}
                </p>
              </div>
            ) : (
              <input
                type="text"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                placeholder="Provider ID"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            )}

            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              disabled={filteredTypes.length === 0}
            >
              <option value="">
                {filteredTypes.length === 0
                  ? "No consultation types available"
                  : "Select Consultation Type"}
              </option>
              {filteredTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>

            {isPrefilledProvider ? (
              <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-foreground-secondary">
                Available times refresh automatically when you change provider
                or consultation type.
              </div>
            ) : (
              <button
                onClick={loadSlots}
                disabled={loadingSlots}
                className="rounded-lg bg-accent-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSlots ? "Loading..." : "Load Slots"}
              </button>
            )}
          </div>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Choose a Date and Time
          </h2>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-foreground-secondary">
              {providerId
                ? "No available consultation times were found in the next 14 days."
                : "Select a provider and consultation type to view availability."}
            </p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Available Dates
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {slotDates.map((date) => {
                    const isSelected = date.key === selectedDate;
                    const count = availableSlots.filter(
                      (slot) =>
                        formatLocal(slot.startsAt, "yyyy-MM-dd") === date.key,
                    ).length;

                    return (
                      <button
                        key={date.key}
                        onClick={() => {
                          setSelectedDate(date.key);
                          setSelectedSlot(null);
                        }}
                        className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "border-primary-500 bg-primary-100"
                            : "border-neutral-300 hover:bg-neutral-50"
                        }`}
                      >
                        <p className="font-semibold text-foreground">
                          {date.label}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {count} time{count === 1 ? "" : "s"} available
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Available Times
                </p>

                {slotsForSelectedDate.length === 0 ? (
                  <p className="text-sm text-foreground-secondary">
                    Choose a date to see available times.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {slotsForSelectedDate.map((slot) => {
                      const isSelected =
                        selectedSlot?.startsAt === slot.startsAt;
                      return (
                        <button
                          key={slot.startsAt}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                            isSelected
                              ? "border-primary-500 bg-primary-100"
                              : "border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          <p className="font-semibold text-foreground">
                            {formatLocal(slot.startsAt, "h:mm a")}
                          </p>
                          <p className="mt-1 text-xs text-foreground-secondary">
                            {dualTimezoneLabel(
                              slot.startsAt,
                              slot.endsAt,
                              slot.providerTimezone,
                            )}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Confirm Booking
          </h2>
          <div className="mb-4 grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
                Provider
              </p>
              <p className="mt-1 font-medium text-foreground">
                {selectedProvider?.name ||
                  prefilledProviderName ||
                  "Not selected"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
                Consultation Type
              </p>
              <p className="mt-1 font-medium text-foreground">
                {selectedType?.name || "Not selected"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
                Selected Date
              </p>
              <p className="mt-1 font-medium text-foreground">
                {selectedSlot
                  ? formatLocal(selectedSlot.startsAt, "EEE, MMM d, yyyy")
                  : selectedDate
                    ? formatLocal(
                        `${selectedDate}T00:00:00Z`,
                        "EEE, MMM d, yyyy",
                      )
                    : "Not selected"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
                Selected Time
              </p>
              <p className="mt-1 font-medium text-foreground">
                {selectedSlot
                  ? formatLocal(selectedSlot.startsAt, "h:mm a")
                  : "Not selected"}
              </p>
            </div>
          </div>
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

export default function ConsultationBookingPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <ConsultationBookingPageContent />
    </Suspense>
  );
}
