import type { Metadata } from "next";
import TrainerTodayClient from "./TrainerTodayClient";

export const metadata: Metadata = {
  title: "Trainer Dashboard",
  description: "Training overview with client progress, sessions, and earnings.",
};

export default function TrainerDashboard() {
  return <TrainerTodayClient />;
}
