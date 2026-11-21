import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { PageHeader } from "@/components/ds/PageHeader";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Profile",
  description: "Edit your trainer profile, specialties, and certifications.",
};

export default function TrainerProfileEditPage() {
  return (
    <TrainerDashboardShell activeItem="My profile" crumb="My profile">
      <PageHeader
        className="mb-1!"
        title={{ before: "My ", emphasis: "profile" }}
        subtitle={<span className="block max-w-[60ch]">How clients see you in the marketplace.</span>}
      />
      <ProviderListingProfile />
    </TrainerDashboardShell>
  );
}
