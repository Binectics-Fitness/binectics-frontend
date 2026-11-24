"use client";

import { useQuery } from "@tanstack/react-query";
import { classBookingsService, type TeachingClass } from "@/lib/api/classBookings";
import { classTime } from "@/lib/api/classes";
import { DSCard, DSCardHead } from "@/components/ds";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The gym classes a staff trainer teaches (the gym linked them as the
 * instructor), in timetable order. Nothing at all for a coach who teaches
 * none, or when the list can't be read.
 */
export function TeachingClassesCard() {
  const { data: classes = [] } = useQuery<TeachingClass[]>({
    queryKey: ["myTeachingClasses"],
    queryFn: async () => {
      const res = await classBookingsService.getMyTeachingClasses();
      return res.success && res.data ? res.data : [];
    },
  });
  if (classes.length === 0) return null;
  const gyms = new Set(classes.map((c) => c.organization_name));
  return (
    <DSCard>
      <DSCardHead
        title="Classes you teach"
        subtitle={`Weekly · gym's local time${gyms.size === 1 ? ` · ${[...gyms][0]}` : ""}`}
      />
      <ul className="flex flex-col">
        {classes.map((c) => (
          <li key={c._id} className="flex items-baseline gap-3 px-5 py-2.5 border-t border-border">
            <span className="font-mono text-[11.5px] w-[92px] shrink-0" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
              {DAYS[c.day_of_week]} {classTime(c.start_time, false)}
            </span>
            <span className="text-[13.5px] min-w-0" style={{ color: "var(--ink)" }}>
              {c.name}
              <span style={{ color: "var(--fg-3)" }}>
                {c.location?.name ? ` · ${c.location.name}` : ""}
                {gyms.size > 1 ? ` · ${c.organization_name}` : ""}
                {` · ${c.duration_minutes}m`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </DSCard>
  );
}
