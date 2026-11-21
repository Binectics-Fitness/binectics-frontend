"use client";

import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { PageHeader } from "@/components/ds";
import { ClosedGymsView } from "@/components/orgClosure/ClosedGymsView";
import { ClosureFacts } from "@/components/orgClosure/CloseGymSection";

export default function ClosedGymsClient() {
  return (
    <GymDashboardShell activeItem="Settings" crumb="Closed gyms">
      <PageHeader
        title="Closed gyms"
        subtitle={
          <span className="block max-w-[60ch]">
            A closed gym keeps all its records. You can reopen it within 30 days of closing, and download your revenue and
            sales records at any time.
          </span>
        }
      />
      <ClosedGymsView />
      <details className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
        <summary className="cursor-pointer">What closing does and does not do</summary>
        <div className="mt-3"><ClosureFacts /></div>
      </details>
    </GymDashboardShell>
  );
}
