"use client";

import { useEffect, useMemo, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, PageHeader } from "@/components/ds";
import {
  MealRating,
  progressService,
  type MealFeedback,
} from "@/lib/api/progress";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

type FeedbackRow = MealFeedback & {
  clientLabel: string;
};

function pillStyle(status: string) {
  if (status === "ok") return { background: "var(--signal-soft)", color: "var(--signal-ink)" };
  if (status === "warn") return { background: "var(--trainer-soft)", color: "var(--warn)" };
  return { background: "var(--danger-soft)", color: "var(--danger)" };
}

export default function DietitianFeedbackPage() {
  const { fmtDate, fmtDateTime } = useOrgFormat();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const clientsRes = await progressService.getMyClientProfiles();
      if (!clientsRes.success || !clientsRes.data || !mounted) {
        setRows([]);
        setLoading(false);
        return;
      }

      const mealsByClient = await Promise.all(
        clientsRes.data.slice(0, 12).map(async (client) => {
          const res = await progressService.getMealFeedbacks(client._id, 8);
          if (!res.success || !res.data) return [];

          const label =
            typeof client.client_id === "object"
              ? `${client.client_id.first_name} ${client.client_id.last_name}`
              : `Client ${client.client_id.slice(-6).toUpperCase()}`;

          return res.data.map((entry) => ({
            ...entry,
            clientLabel: label,
          }));
        }),
      );

      if (!mounted) return;

      const merged = mealsByClient
        .flat()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 30);

      setRows(merged);
      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const awaitingReview = useMemo(
    () => rows.filter((r) => !r.feedback || !r.feedback.trim()).length,
    [rows],
  );

  const renderStatus = (row: FeedbackRow) => {
    if (!row.feedback?.trim()) {
      return { status: "warn", text: "pending review" };
    }

    if (row.rating === MealRating.POOR) {
      return { status: "danger", text: "needs correction" };
    }

    if (row.rating === MealRating.GOOD || row.rating === MealRating.GREAT) {
      return { status: "ok", text: "on plan" };
    }

    return { status: "warn", text: "reviewed" };
  };

  return (
    <DietitianDashboardShell activeItem="Settings" crumb="Meal feedback">
      <PageHeader
        className="mb-0!"
        title={{ before: "Meal ", emphasis: "feedback", after: ` · ${loading ? "loading..." : `${awaitingReview} awaiting review`}` }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {rows.map((m) => {
          const state = renderStatus(m);
          return (
          <DSCard key={m._id}>
            {/* Image placeholder */}
            <div className="aspect-[4/3]" style={{ background: "linear-gradient(135deg, var(--bg-2), var(--bg-3))" }} />
            <div className="p-5.5 pt-3.5">
              <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{m.clientLabel}</div>
              <Eyebrow className="mt-0.5 mb-2">{m.meal_type.toLowerCase()} · {fmtDate(m.meal_date)}</Eyebrow>
              <div className="text-[13px] mb-3" style={{ color: "var(--fg-2)" }}>{m.description}</div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={pillStyle(state.status)}>{state.text}</span>
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{fmtDateTime(m.created_at)}</span>
              </div>
            </div>
          </DSCard>
          );
        })}
        {loading && rows.length === 0 && (
          <DSCard className="px-4.5 py-6">
            <AsyncSpinner label="Loading meal feedback" />
          </DSCard>
        )}
        {!loading && rows.length === 0 && (
          <DSCard className="px-4.5 py-6">
            <EmptySlate message="No meal feedback entries yet." mt="mt-0" />
          </DSCard>
        )}
      </div>
    </DietitianDashboardShell>
  );
}
