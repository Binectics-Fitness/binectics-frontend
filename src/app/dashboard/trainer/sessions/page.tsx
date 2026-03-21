"use client";

import Link from "next/link";
import ComingSoonPage from "@/components/ComingSoonPage";
import TrainerSidebar from "@/components/TrainerSidebar";
import TimezoneHelpBadge from "@/components/TimezoneHelpBadge";
import { getClientTimezone } from "@/utils/format";

export default function Page() {
  const userTimezone = getClientTimezone();

  return (
    <div className="flex min-h-screen bg-background">
      <TrainerSidebar />

      <main className="ml-64 flex-1 p-8">
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <h1 className="font-display text-2xl font-black text-foreground">
              Sessions & Schedule
            </h1>
            <TimezoneHelpBadge
              message="When trainer consultations become bookable, your chosen availability timezone controls how session windows are interpreted before they are converted for clients."
              label="Scheduling timezone help"
            />
          </div>

          <p className="text-sm text-foreground-secondary">
            Your current browser timezone is{" "}
            <span className="font-semibold text-foreground">
              {userTimezone}
            </span>
            . Use consultation availability rules to define your schedule in
            that timezone, then client-facing booking times will be converted
            automatically.
          </p>

          <div className="mt-4">
            <Link
              href="/dashboard/trainer/consultations"
              className="inline-flex items-center rounded-lg bg-accent-blue-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Manage Consultation Availability
            </Link>
          </div>
        </section>

        <ComingSoonPage
          title="Sessions Coming Soon"
          description="Schedule and manage training sessions with your clients."
          backLink="/dashboard/trainer"
          backLabel="Back to Dashboard"
        />
      </main>
    </div>
  );
}
