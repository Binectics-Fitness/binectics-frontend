import type { Metadata } from "next";
import TrainerRevenueClient from "./TrainerRevenueClient";

export const metadata: Metadata = {
  title: "Revenue by trainer",
  description: "Settled revenue attributed to each trainer, per currency",
};

export default function GymRevenueByTrainerPage() {
  return <TrainerRevenueClient />;
}
