import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { DisputeDetail } from "@/components/refunds/DisputeDetail";

export const metadata: Metadata = {
  title: "Dispute",
  description: "Dispute detail",
};

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  return (
    <AdminDashboardShell activeItem="Disputes" crumb="Dispute">
      <Link href="/admin/disputes" className="text-[13px] underline" style={{ color: "var(--fg-2)" }}>
        Back to disputes
      </Link>
      <div className="rounded-(--r-3) p-4.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <DisputeDetail mode="admin" disputeId={disputeId} />
      </div>
    </AdminDashboardShell>
  );
}
