import type { Metadata } from "next";
import RevenueClient from "./RevenueClient";

export const metadata: Metadata = {
  title: "Revenue",
  description: "Track your gym revenue, trends, and financial performance.",
};

export default function GymRevenuePage() {
  return <RevenueClient />;
}
