import { SettingsClient } from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gym Settings",
  description: "Configure your gym profile, hours, and operational settings.",
};

export default function GymSettingsPage() {
  return <SettingsClient />;
}
