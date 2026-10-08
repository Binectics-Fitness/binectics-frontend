"use client";

import { useState } from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { DSCard, Eyebrow, PageHeader } from "@/components/ds";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useGymClasses, useCreateGymClass } from "@/lib/queries/classes";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { ClassForm, WEEKDAYS } from "./ClassForm";
import { classTime, type GymClass } from "@/lib/api/classes";

/**
 * Weekly class timetable backed by the classes API. Week columns start on
 * the org's configured first day of week. Replaces the static mockup grid.
 */
export function ScheduleClient() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: classes = [], isLoading } = useGymClasses(orgId);
  const create = useCreateGymClass(orgId);
  const { prefs, weekStartsOn } = useOrgFormat();
  const twelveHour = prefs.timeFormat === "12h";

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rotate day columns to the org's week start.
  const dayOrder = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

  const onCreate = async (data: Parameters<typeof create.mutateAsync>[0]) => {
    setError(null);
    const res = await create.mutateAsync(data);
    if (res.success) setAdding(false);
    else setError(res.message || "Couldn't create the class.");
  };

  return (
    <GymDashboardShell
      activeItem="Schedule"
      crumb="Schedule"
      actions={
        <button className="btn-primary-v2 sm" disabled={!orgId} onClick={() => setAdding(true)}>+ New class</button>
      }
    >
      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader
        className="mb-0!"
        title="Schedule"
        subtitle={
          <span className="block max-w-[60ch]">
            Your weekly class timetable. Times are in your gym&rsquo;s time zone{prefs.timeZone ? ` (${prefs.timeZone})` : ""}.
          </span>
        }
      />

      {adding && (
        // overflow-visible: the form's selects open an in-flow dropdown.
        <DSCard className="p-5.5 overflow-visible!">
          <h2 className="text-[16px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>New class</h2>
          <ClassForm saving={create.isPending} error={error} onSubmit={(d) => void onCreate(d)} onCancel={() => setAdding(false)} submitLabel="Create class" />
        </DSCard>
      )}

      {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading timetable…</p>}

      {!isLoading && classes.length === 0 && !adding && (
        <DSCard className="flex flex-col items-center text-center px-6 py-14">
          <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>No classes yet</h2>
          <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
            Build your weekly timetable, recurring classes members will see on your listing.
          </p>
          <button className="btn-primary-v2 sm mt-5" disabled={!orgId} onClick={() => setAdding(true)}>+ New class</button>
        </DSCard>
      )}

      {classes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 items-start">
          {dayOrder.map((day) => {
            const dayClasses = classes.filter((c) => c.day_of_week === day);
            return (
              <div key={day} className="flex flex-col gap-2 min-w-0">
                <Eyebrow className="px-1">
                  {WEEKDAYS[day].slice(0, 3)}
                  <span className="ml-1.5" style={{ color: "var(--fg-4)" }}>{dayClasses.length || ""}</span>
                </Eyebrow>
                {dayClasses.length === 0 ? (
                  <div className="rounded-(--r-2) px-2.5 py-3 text-center font-mono text-[10px] uppercase tracking-[0.04em]" style={{ border: "1px dashed var(--border)", color: "var(--fg-4)" }}>-</div>
                ) : (
                  dayClasses.map((c) => <ClassCard key={c._id} gymClass={c} twelveHour={twelveHour} />)
                )}
              </div>
            );
          })}
        </div>
      )}
    </GymDashboardShell>
  );
}

function ClassCard({ gymClass: c, twelveHour }: { gymClass: GymClass; twelveHour: boolean }) {
  return (
    <Link href={`/dashboard/gym-owner/schedule/${c._id}`} className="block rounded-(--r-2) p-2.5" style={{ background: "var(--bg)", border: "1px solid var(--border)", textDecoration: "none" }}>
      <div className="font-mono text-[11px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
        {classTime(c.start_time, twelveHour)} · {c.duration_minutes}m
      </div>
      <div className="text-[13px] font-medium mt-1 leading-snug" style={{ color: "var(--ink)" }}>{c.name}</div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>
        {c.instructor_name ? `${c.instructor_name} · ` : ""}cap {c.capacity}{c.waitlist_enabled ? " · WL" : ""}
      </div>
    </Link>
  );
}
