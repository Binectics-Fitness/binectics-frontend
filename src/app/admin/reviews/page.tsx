import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Moderate marketplace reviews",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function AdminReviewsPage() {
  return (
    <AdminDashboardShell activeItem={"Reviews"} crumb={"Reviews"}>
      <FeaturePending
        title={"Reviews"}
        subtitle={"Moderate marketplace reviews"}
        pendingTitle={"Review moderation is coming soon"}
        pendingBody={"Flagged-review queues and moderation actions will appear here once the moderation endpoints are built. Member reviews are live on marketplace listings today \u2014 this page previously showed fabricated records."}
        cta={{ href: "/admin/listings", label: "Manage listings" }}
      />
    </AdminDashboardShell>
  );
}
