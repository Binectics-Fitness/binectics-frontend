import type { Metadata } from "next";
import LocationsClient from "./LocationsClient";

export const metadata: Metadata = {
  title: "Locations",
  description: "Manage your gym locations and branch settings.",
};

export default function GymLocationsPage() {
  return <LocationsClient />;
}
