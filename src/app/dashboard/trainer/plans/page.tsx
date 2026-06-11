import type { Metadata } from "next";
import PlansClient from "./PlansClient";

export const metadata: Metadata = {
  title: "Plans",
  description: "Create and manage your training plans and packages.",
};

export default function TrainerPlansPage() {
  return <PlansClient />;
}
