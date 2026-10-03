import type { Metadata } from "next";
import { SavedProvidersClient } from "./SavedProvidersClient";

export const metadata: Metadata = {
  title: "Saved Providers",
  description: "View your saved gyms, trainers, and dietitians.",
};

export default function SavedProvidersPage() {
  return <SavedProvidersClient />;
}
