import type { Metadata } from "next";
import FeatureFlagDetailClient from "./FeatureFlagDetailClient";

export const metadata: Metadata = {
  title: "Feature flag",
  description: "A feature flag's organisation overrides and history",
};

export default function AdminFeatureFlagDetailPage() {
  return <FeatureFlagDetailClient />;
}
