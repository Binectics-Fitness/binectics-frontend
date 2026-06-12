import type { Metadata } from "next";
import DietitianTodayClient from "./DietitianTodayClient";

export const metadata: Metadata = {
  title: "Dietitian Dashboard",
  description: "Nutrition practice overview with clients, adherence, and earnings.",
};

export default function DietitianDashboard() {
  return <DietitianTodayClient />;
}
