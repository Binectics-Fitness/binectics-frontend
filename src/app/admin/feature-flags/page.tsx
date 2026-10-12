import type { Metadata } from "next";
import FeatureFlagsClient from "./FeatureFlagsClient";

export const metadata: Metadata = {
  title: "Feature flags",
  description: "Switch features on or off globally or per organisation",
};

export default function AdminFeatureFlagsPage() {
  return <FeatureFlagsClient />;
}
