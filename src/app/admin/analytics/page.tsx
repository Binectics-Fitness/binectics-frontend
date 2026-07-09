import { AnalyticsClient } from "./AnalyticsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Platform-wide analytics and reporting for Binectics administrators.",
};

export default function AdminAnalyticsPage() {
  return <AnalyticsClient />;
}
