import { GymPlansClient } from "./GymPlansClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans",
  description: "Create and manage membership plans for your gym.",
};

export default function GymPlansPage() {
  return <GymPlansClient />;
}
