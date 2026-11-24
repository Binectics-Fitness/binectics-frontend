"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { coachAttentionService, type AttentionItem } from "@/lib/api/coachAttention";
import { useSettledThisMonth } from "./useSettledThisMonth";

/** How far back "Needs you" looks, like mobile. */
export const ATTENTION_DAYS = 2;

export interface CoachTodayData {
  clients: ClientProfile[];
  bookings: ConsultationBooking[];
  /** When the bookings were read (0 until then): "now" for the schedule. */
  loadedAt: number;
  loading: boolean;
  error: string | null;
  /** This month's settled earnings, formatted; null when not shown. */
  settled: string | null;
  /** The client list couldn't be read: an empty `clients` means unknown, not none. */
  clientsFailed?: boolean;
  /**
   * "Needs you": forms submitted and tasks missed, newest first. Empty when
   * there are none or the read failed; the section is then simply absent.
   */
  attention?: AttentionItem[];
  /** Read everything again (after a session is closed out). */
  reload?: () => Promise<void>;
}

/**
 * Everything the coach Today page reads. The page component calls it and
 * hands the result to CoachToday, which only renders what it is given.
 */
export function useCoachTodayData(): CoachTodayData {
  const settled = useSettledThisMonth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientsFailed, setClientsFailed] = useState(false);
  const active = useRef(true);

  /** `quiet`: a reload keeps the page on screen instead of the spinner. */
  const load = useCallback(async (quiet: boolean) => {
    if (!quiet) setLoading(true);
    const [clientsRes, bookingsRes, attentionRes] = await Promise.allSettled([
      progressService.getMyClientProfiles(),
      consultationsService.getProviderBookings(),
      coachAttentionService.getAttention(ATTENTION_DAYS),
    ]);
    if (!active.current) return;

    let anyOk = false;
    const clientsOk = clientsRes.status === "fulfilled" && clientsRes.value.success && !!clientsRes.value.data;
    if (clientsOk) {
      setClients(clientsRes.value.data!);
      anyOk = true;
    }
    setClientsFailed(!clientsOk);
    if (bookingsRes.status === "fulfilled" && bookingsRes.value.success && bookingsRes.value.data) {
      setBookings(bookingsRes.value.data);
      anyOk = true;
    }
    // Optional, like mobile: a failed read keeps the last list (or none).
    if (attentionRes.status === "fulfilled") setAttention(attentionRes.value);
    setLoadedAt(Date.now());
    setError(anyOk ? null : "Couldn't load your dashboard. Try again.");
    setLoading(false);
  }, []);

  useEffect(() => {
    active.current = true;
    const kick = window.setTimeout(() => void load(false), 0);
    return () => {
      active.current = false;
      window.clearTimeout(kick);
    };
  }, [load]);

  const reload = useCallback(() => load(true), [load]);

  return { clients, bookings, loadedAt, loading, error, settled, clientsFailed, attention, reload };
}
