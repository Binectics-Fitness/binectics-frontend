"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { localeForDateFormat } from "@/lib/format/orgFormat";
import {
  useGymClass,
  useUpdateGymClass,
  useDeleteGymClass,
} from "@/lib/queries/classes";
import {
  classBookingsService,
  nextOccurrences,
  type ClassBooking,
} from "@/lib/api/classBookings";
import { ClassForm, WEEKDAYS } from "../ClassForm";

function memberName(b: ClassBooking): string {
  if (typeof b.member_user_id === "object") {
    return `${b.member_user_id.first_name} ${b.member_user_id.last_name}`;
  }
  return "Member";
}

/** Roster for one occurrence of the class (confirmed + waitlist). */
function OccurrenceRoster({ orgId, classId, dayOfWeek }: { orgId: string; classId: string; dayOfWeek: number }) {
  const { prefs } = useOrgFormat();
  const dateLocale = localeForDateFormat(prefs);
  const dates = nextOccurrences(dayOfWeek, 4);
  const [date, setDate] = useState(dates[0]);
  const { data: roster = [], isLoading } = useQuery<ClassBooking[]>({
    queryKey: ["classRoster", orgId, classId, date],
    queryFn: async () => {
      const res = await classBookingsService.getRoster(orgId, classId, date);
      return res.success && res.data ? res.data : [];
    },
  });

  const confirmed = roster.filter((b) => b.status === "confirmed");
  const waitlisted = roster.filter((b) => b.status === "waitlisted");

  return (
    <section className="rounded-(--r-3) overflow-hidden max-w-[720px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5.5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Roster</h2>
          <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
            {isLoading ? "Loading…" : `${confirmed.length} confirmed${waitlisted.length ? ` · ${waitlisted.length} waitlisted` : ""}`}
          </div>
        </div>
        <select value={date} onChange={(e) => setDate(e.target.value)}
          className="h-8 rounded-(--r-2) px-2.5 text-[12.5px]"
          style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }}>
          {dates.map((d) => (
            <option key={d} value={d}>
              {new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </option>
          ))}
        </select>
      </div>
      {!isLoading && roster.length === 0 && (
        <p className="px-5.5 py-6 text-[13px]" style={{ color: "var(--fg-3)" }}>No bookings for this occurrence yet.</p>
      )}
      {roster.map((b, i) => (
        <div key={b._id} className="flex items-center gap-3 px-5.5 py-2.5" style={{ borderBottom: i < roster.length - 1 ? "1px solid var(--border)" : "none" }}>
          <span className="flex-1 text-[13.5px]" style={{ color: "var(--ink)" }}>{memberName(b)}</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]"
            style={b.status === "confirmed"
              ? { background: "var(--signal-soft)", color: "var(--signal-ink)" }
              : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }}>
            {b.status === "confirmed" ? "Confirmed" : "Waitlist"}
          </span>
        </div>
      ))}
    </section>
  );
}

/** Edit / deactivate / delete a single weekly class. */
export function ClassDetailClient() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: gymClass, isLoading } = useGymClass(orgId, classId);
  const update = useUpdateGymClass(orgId);
  const remove = useDeleteGymClass(orgId);
  const [error, setError] = useState<string | null>(null);

  const onSave = async (data: Parameters<typeof update.mutateAsync>[0]["data"]) => {
    setError(null);
    const res = await update.mutateAsync({ classId, data });
    if (res.success) router.push("/dashboard/gym-owner/schedule");
    else setError(res.message || "Couldn't save the class.");
  };

  const onToggleActive = async () => {
    if (!gymClass) return;
    const res = await update.mutateAsync({
      classId,
      data: { is_active: !gymClass.is_active },
    });
    if (!res.success) setError(res.message || "Couldn't update the class.");
  };

  const onDelete = async () => {
    if (!gymClass) return;
    if (window.confirm(`Delete "${gymClass.name}" (${WEEKDAYS[gymClass.day_of_week]} ${gymClass.start_time})? This can't be undone.`)) {
      const res = await remove.mutateAsync(classId);
      if (res.success) router.push("/dashboard/gym-owner/schedule");
      else setError(res.message || "Couldn't delete the class.");
    }
  };

  return (
    <GymDashboardShell
      activeItem="Schedule"
      crumb={gymClass?.name ?? "Class"}
      actions={
        gymClass && (
          <div className="flex items-center gap-2">
            <button className="btn-ghost-v2 sm" disabled={update.isPending} onClick={() => void onToggleActive()}>
              {gymClass.is_active ? "Deactivate" : "Reactivate"}
            </button>
            <button className="btn-ghost-v2 sm" disabled={remove.isPending} onClick={() => void onDelete()}>
              Delete
            </button>
          </div>
        )
      }
    >
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          {gymClass?.name ?? "Class"}
          {gymClass && !gymClass.is_active && (
            <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full align-middle" style={{ background: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>Inactive</span>
          )}
        </h1>
      </div>

      {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading class…</p>}
      {!isLoading && !gymClass && (
        <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>Class not found — it may have been deleted.</p>
      )}
      {gymClass && orgId && (
        <OccurrenceRoster orgId={orgId} classId={classId} dayOfWeek={gymClass.day_of_week} />
      )}

      {gymClass && (
        <section className="rounded-(--r-3) p-5.5 max-w-[720px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <ClassForm
            initial={gymClass}
            saving={update.isPending}
            error={error}
            onSubmit={(d) => void onSave(d)}
            onCancel={() => router.push("/dashboard/gym-owner/schedule")}
          />
        </section>
      )}
    </GymDashboardShell>
  );
}
