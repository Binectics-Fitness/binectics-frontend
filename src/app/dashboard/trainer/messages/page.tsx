import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trainer Messages",
  description: "Messaging is planned for a future release.",
};

export default function TrainerMessagesPage() {
  return (
    <TrainerDashboardShell activeItem="Inbox" crumb="Messages">
      <section className="rounded-(--r-3) border p-6 sm:p-8" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          Coming soon
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Trainer messaging is phase 2
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: "var(--fg-2)" }}>
          Message threads are not enabled in this phase. Continue communication through booked sessions and shared progress notes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/bookings" className="btn-primary-v2 sm">
            Open bookings
          </Link>
          <Link href="/dashboard/trainer/clients" className="btn-ghost-v2 sm">
            View clients
          </Link>
        </div>
      </section>
    </TrainerDashboardShell>
  );
}
