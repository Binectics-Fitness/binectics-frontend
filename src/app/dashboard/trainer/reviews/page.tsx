import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { PageHeader } from "@/components/ds/PageHeader";
import { TrainerReviewsClient } from "./TrainerReviewsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Read, answer and report reviews of your trainer profile.",
};

export default function TrainerReviewsPage() {
  return (
    <TrainerDashboardShell activeItem="Reviews" crumb="Reviews">
      <PageHeader className="mb-1!" title="Reviews" />
      <TrainerReviewsClient />
    </TrainerDashboardShell>
  );
}
