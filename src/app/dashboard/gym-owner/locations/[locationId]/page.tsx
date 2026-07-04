import type { Metadata } from "next";
import LocationDetailClient from "./LocationDetailClient";

export const metadata: Metadata = {
  title: "Location",
  description: "View and edit a gym location.",
};

export default function GymLocationDetailPage() {
  return <LocationDetailClient />;
}
