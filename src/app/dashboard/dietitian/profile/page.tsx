import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { PageHeader } from "@/components/ds/PageHeader";
import { ProfileTabs } from "./ReviewsTab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dietitian Profile",
  description: "Edit your dietitian profile, specialties, and credentials.",
};

export default function DietitianProfilePage() {
  return (
    <DietitianDashboardShell activeItem="My profile" crumb="My profile">
      <PageHeader
        className="mb-1!"
        title={{ before: "My ", emphasis: "profile" }}
        subtitle={<span className="block max-w-[60ch]">How you appear to clients in the marketplace, plus the reviews clients have left you.</span>}
      />
      <ProfileTabs />
    </DietitianDashboardShell>
  );
}
