"use client";

import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { BookSessionButton } from "./_actions";
import { CoachToday } from "./_components/CoachToday";
import { useCoachTodayData } from "./_components/useCoachTodayData";
import { useTrainerAccess } from "@/hooks/useTrainerAccess";

export default function TrainerTodayClient() {
  // Trainers, and gym owners who coach from their own trainer workspace;
  // everyone else is redirected to their own dashboard.
  const { isAuthorized } = useTrainerAccess();
  if (!isAuthorized) return null;
  return <TrainerTodayContent />;
}

function TrainerTodayContent() {
  const data = useCoachTodayData();
  return (
    <TrainerDashboardShell activeItem="Today" crumb="Today" actions={<BookSessionButton />}>
      <CoachToday
        data={data}
        noun="session"
        sessionHref={(id) => `/dashboard/trainer/sessions/${id}`}
        calendarHref="/dashboard/trainer/sessions"
        clientsHref="/dashboard/trainer/clients"
        clientHref={(id) => `/dashboard/trainer/clients/${id}`}
      />
    </TrainerDashboardShell>
  );
}
