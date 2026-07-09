import { HealthMetricsClient } from "./HealthMetricsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Metrics",
  description: "Track your health metrics including weight and progress.",
};

export default function HealthMetricsPage() {
  return <HealthMetricsClient />;
}
