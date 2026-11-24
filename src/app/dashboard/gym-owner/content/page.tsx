import { GymContentClient } from "./GymContentClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs & meal plans",
  description: "Set the gym's programs and meal plans free or paid.",
};

export default function GymContentPage() {
  return <GymContentClient />;
}
