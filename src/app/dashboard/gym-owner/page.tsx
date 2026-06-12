import type { Metadata } from "next";
import GymOverviewClient from "./GymOverviewClient";

export const metadata: Metadata = {
  title: "Gym Dashboard",
  description: "Gym performance overview with revenue, members, and check-in stats.",
};

export default function GymOwnerDashboard() {
  return <GymOverviewClient />;
}
