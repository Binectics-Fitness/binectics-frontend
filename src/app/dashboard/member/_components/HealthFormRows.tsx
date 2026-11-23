"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { IconTile, ListRow } from "@/components/ds";
import { myHealthFormsService, type MyHealthForm } from "@/lib/api/healthForms";
import { HEALTH_FORM_COPY as C } from "@/lib/constants/healthFormCopy";

/** The PAR-Q template has eight questions; the row says so before the form loads. */
export const PARQ_QUESTION_COUNT = 8;

export const MY_HEALTH_FORMS_KEY = ["myHealthForms"] as const;

export function healthFormHref(id: string): string {
  return `/dashboard/member/health-forms/${encodeURIComponent(id)}`;
}

/**
 * One row per gym health form still to fill in (board parq M1; mobile #273
 * HealthFormTodayRows). Read again when the window regains focus, so a form
 * sent elsewhere drops off. Nothing is shown while it loads or when the read
 * fails: the form is never urgent enough to put a state on the page.
 *
 * Mounted on the bookings page. The coached Today (web PR #350) mounts it
 * too, under the visits row, as on mobile.
 */
export function HealthFormRows({ className = "" }: { className?: string }) {
  const { data: pending = [] } = useQuery<MyHealthForm[]>({
    queryKey: MY_HEALTH_FORMS_KEY,
    queryFn: async () => {
      const res = await myHealthFormsService.list();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    select: (all) => all.filter((f) => f.status === "pending"),
    retry: false,
  });

  if (pending.length === 0) return null;
  return (
    <div className={`flex flex-col gap-2 ${className}`} data-testid="health-form-rows">
      {pending.map((f) => (
        <div key={f.id} data-testid={`health-form-row-${f.id}`}>
          <ListRow
            href={healthFormHref(f.id)}
            title={C.taskTitle}
            meta={C.taskMeta(f.organization_name || C.yourGym, PARQ_QUESTION_COUNT)}
            leading={<IconTile icon={FileText} tone="gym" />}
            className="min-h-11"
          />
        </div>
      ))}
    </div>
  );
}
