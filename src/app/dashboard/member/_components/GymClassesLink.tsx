"use client";

import Link from "next/link";
import { useMyProviders } from "@/components/messaging/MyCoachesCard";
import { NO_TIMETABLE, useListingTimetable } from "@/lib/queries/classes";

/** Where a gym's timetable is booked: its listing's schedule section. */
export function gymClassesHref(listingId: string): string {
  return `/marketplace/${encodeURIComponent(listingId)}#schedule`;
}

/**
 * "Classes" on the My gym card (discoverability F15): classes are booked on
 * the gym's listing, which nothing on home led to. Shown only when the gym
 * has a listing that opens (from my-providers, which already picks the
 * branch the member joined) and that listing has classes; a gym without a
 * timetable gets no button that leads to nothing. The classes read is the
 * listing schedule section's own (useListingTimetable): one cache entry,
 * one shape.
 */
export function GymClassesLink({ organizationId, gymName }: { organizationId: string; gymName: string }) {
  const { data: providers } = useMyProviders();
  const listingId = providers?.gyms.find((g) => g.organization_id === organizationId)?.listing?._id ?? null;
  const { data: { classes } = NO_TIMETABLE } = useListingTimetable(listingId);
  if (!listingId || classes.length === 0) return null;
  return (
    <Link
      href={gymClassesHref(listingId)}
      className="btn-ghost-v2 sm"
      style={{ whiteSpace: "nowrap" }}
      aria-label={`Book a class at ${gymName}`}
    >
      Classes
    </Link>
  );
}
