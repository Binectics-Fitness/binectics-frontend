"use client";

import { useEffect, useState } from "react";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { useSettledThisMonth } from "./useSettledThisMonth";

export interface CoachTodayData {
  clients: ClientProfile[];
  bookings: ConsultationBooking[];
  /** When the bookings were read (0 until then): "now" for the schedule. */
  loadedAt: number;
  loading: boolean;
  error: string | null;
  /** This month's settled earnings, formatted; null when not shown. */
  settled: string | null;
}

/**
 * Everything the coach Today page reads. The page component calls it and
 * hands the result to CoachToday, which only renders what it is given.
 */
export function useCoachTodayData(): CoachTodayData {
  const settled = useSettledThisMonth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const [clientsRes, bookingsRes] = await Promise.allSettled([
        progressService.getMyClientProfiles(),
        consultationsService.getProviderBookings(),
      ]);
      if (!active) return;

      let anyOk = false;
      if (clientsRes.status === "fulfilled" && clientsRes.value.success && clientsRes.value.data) {
        setClients(clientsRes.value.data);
        anyOk = true;
      }
      if (bookingsRes.status === "fulfilled" && bookingsRes.value.success && bookingsRes.value.data) {
        setBookings(bookingsRes.value.data);
        anyOk = true;
      }
      setLoadedAt(Date.now());
      setError(anyOk ? null : "We couldn't load your dashboard. Try again shortly.");
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  return { clients, bookings, loadedAt, loading, error, settled };
}
