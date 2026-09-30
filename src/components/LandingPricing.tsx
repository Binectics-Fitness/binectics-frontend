"use client";

import { useState } from "react";
import { TogglePill } from "@/components/ds/TogglePill";
import { ProviderPricing } from "@/components/pricing/ProviderPricing";
import { MemberPricing } from "@/components/pricing/MemberPricing";

/**
 * The landing page's pricing block: the same catalogue-driven provider plans
 * as /pricing, or the member note (members have no plan to buy).
 */
export default function LandingPricing() {
  const [audience, setAudience] = useState<"provider" | "member">("provider");

  return (
    <div>
      <div className="flex justify-center mb-4">
        <TogglePill
          label="I'm a"
          options={[{ value: "provider" as const, label: "Provider" }, { value: "member" as const, label: "Member" }]}
          value={audience}
          onChange={setAudience}
        />
      </div>
      {audience === "provider" ? <ProviderPricing /> : <MemberPricing />}
    </div>
  );
}
