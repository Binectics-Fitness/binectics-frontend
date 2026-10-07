import { StreaksClient } from "./StreaksClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Streaks",
  description: "Your gym check-in streak, milestones and lifetime stats.",
};

export default function StreaksPage() {
  return <StreaksClient />;
}
