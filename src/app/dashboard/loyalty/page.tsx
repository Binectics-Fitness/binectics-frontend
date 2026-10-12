"use client";

import { RoleShell } from "@/components/ds/RoleShell";
import { MemberLoyalty } from "@/components/loyalty/MemberLoyalty";
import { ProviderLoyaltyPanel } from "@/components/loyalty/ProviderLoyaltyPanel";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";

/**
 * Loyalty is each provider's own, opt-in program.
 *
 * - A member sees the programs of their providers that turned it on, one at
 *   a time: points earned with a provider spend only on its rewards.
 * - A provider (gym, trainer, dietitian) turns its own program on or off and
 *   manages its rewards here.
 *
 * RoleShell renders each role its own chrome; hard-wiring GymDashboardShell
 * put the page behind useRoleGuard(GYM_OWNER) and bounced members.
 */
export default function LoyaltyPage() {
  const { user } = useAuth();
  const isMember = user?.role === UserRole.USER;

  return (
    <RoleShell activeItem="Loyalty" memberActiveLabel="Loyalty" crumb="Loyalty">
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            {isMember ? "Member" : "Your program"}
          </div>
          <h1 className="text-[30px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Loyalty
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
            {isMember
              ? "Points you earn with a provider spend on that provider's own rewards."
              : "Reward your clients for showing up, with rewards you choose and hand out."}
          </p>
        </div>
        {isMember ? <MemberLoyalty /> : <ProviderLoyaltyPanel />}
      </div>
    </RoleShell>
  );
}
