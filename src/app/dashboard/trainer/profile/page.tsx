import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Profile",
  description: "Edit your trainer profile, specialties, and certifications.",
};

export default function TrainerProfileEditPage() {
  return (
    <TrainerDashboardShell activeItem="My profile" crumb="My profile">
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>My profile</h1>
        <div className="text-[13.5px] mt-1.5 max-w-[60ch]" style={{ color: "var(--fg-3)" }}>
          How you appear to clients in the marketplace. Save, then publish to go live.
        </div>
      </div>
      <ProviderListingProfile />
    </TrainerDashboardShell>
  );
}
