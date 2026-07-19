import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit profile",
  description: "Edit your public marketplace profile.",
};

export default function ProfileEditPage() {
  return (
    <GymDashboardShell activeItem="My listing" crumb="My listing">
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>My listing</h1>
        <div className="text-[13.5px] mt-1.5 max-w-[60ch]" style={{ color: "var(--fg-3)" }}>
          How your gym appears in the marketplace. Save, then publish to go live.
        </div>
      </div>
      <ProviderListingProfile />
    </GymDashboardShell>
  );
}
