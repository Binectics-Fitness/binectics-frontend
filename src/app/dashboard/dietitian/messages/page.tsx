import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dietitian Messages",
  description: "Messaging is planned for a future release.",
};

export default function DietitianMessagesPage() {
  return (
    <DietitianDashboardShell activeItem="Inbox" crumb="Messages">
      <section className="rounded-(--r-3) border p-6 sm:p-8" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          Coming soon
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Dietitian messaging is phase 2
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: "var(--fg-2)" }}>
          Direct message threads are deferred for this release. Keep client coordination in consultation bookings and plan updates.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/bookings" className="btn-primary-v2 sm">
            Open bookings
          </Link>
          <Link href="/dashboard/dietitian/clients" className="btn-ghost-v2 sm">
            View clients
          </Link>
        </div>
      </section>
    </DietitianDashboardShell>
  );
}
