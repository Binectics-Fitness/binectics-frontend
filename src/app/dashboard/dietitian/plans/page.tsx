import type { Metadata } from "next";
import DietitianPlansClient from "./PlansClient";

export const metadata: Metadata = {
  title: "Plans",
  description: "Create and manage your nutrition plans and packages.",
};

export default function DietitianPlansPage() {
  return <DietitianPlansClient />;
}
