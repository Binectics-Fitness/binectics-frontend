import { StreaksClient } from "./StreaksClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Streaks",
  description: "View your workout streaks and consistency stats.",
};

export default function StreaksPage() {
  return <StreaksClient />;
}
