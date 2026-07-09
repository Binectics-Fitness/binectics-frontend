"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useGymClass,
  useUpdateGymClass,
  useDeleteGymClass,
} from "@/lib/queries/classes";
import { ClassForm, WEEKDAYS } from "../ClassForm";

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
