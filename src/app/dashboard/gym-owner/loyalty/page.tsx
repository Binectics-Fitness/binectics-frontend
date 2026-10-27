import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { ProviderLoyaltyPanel } from "@/components/loyalty/ProviderLoyaltyPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty",
  description: "Your gym's own loyalty program and rewards.",
};

/**
 * The gym's loyalty program, in the gym's workspace. Under /dashboard/gym-owner
 * the gym is the current workspace, so the owner and the gym's staff (with
 * manage_organization) both manage the gym's program here, whatever their
 * own account role. /dashboard/loyalty stays the shared page for members,
 * trainers and dietitians.
 */
export default function GymLoyaltyPage() {
  return (
    <GymDashboardShell activeItem="Loyalty" crumb="Loyalty">
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Gym program
          </div>
          <h1 className="text-[30px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Loyalty
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
            Reward the gym&apos;s members for showing up, with rewards you choose and hand out.
          </p>
        </div>
        <ProviderLoyaltyPanel />
      </div>
    </GymDashboardShell>
  );
}
