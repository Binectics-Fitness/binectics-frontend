import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Messages",
  description: "Messaging is planned for a future release.",
};

export default function MessagesPage() {
  return (
    <TrainerDashboardShell activeItem="Inbox" crumb="Messages">
      <section className="rounded-(--r-3) border p-6 sm:p-8" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          Coming soon
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Messaging is not in v1
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: "var(--fg-2)" }}>
          In-app messaging is planned for phase 2. For now, manage sessions and client updates from bookings and consultation notes.
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
