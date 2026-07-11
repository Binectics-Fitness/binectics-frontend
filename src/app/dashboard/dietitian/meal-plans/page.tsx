import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { FeaturePending } from "@/components/ds/FeaturePending";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meal plans",
  description: "Reusable plan templates",
};

/**
 * Honest pending state — this page previously rendered fabricated demo
 * data. Policy: wire what has a backend; never fabricate.
 */
export default function DietitianMealPlansPage() {
  return (
    <DietitianDashboardShell activeItem={"Meal plans"} crumb={"Meal plans"}>
      <FeaturePending
        title={"Meal plans"}
        subtitle={"Reusable plan templates"}
        pendingTitle={"Meal plan templates are coming soon"}
        pendingBody={"A template library you can assign to clients will appear here once the meal-plan subsystem is built. Client meal LOGGING is real today via client profiles. This page previously showed fabricated templates."}
      />
    </DietitianDashboardShell>
  );
}
