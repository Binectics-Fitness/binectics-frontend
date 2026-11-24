import type { Metadata } from "next";
import { StarterHistory } from "@/components/starter/StarterHistory";
import { StarterShell } from "../_shell";

export const metadata: Metadata = {
  title: "Your history",
  description: "Your starter program week by week: sessions done, done late, skipped or missed, and the numbers you logged.",
};

export default function StarterHistoryPage() {
  return (
    <StarterShell>
      <StarterHistory />
    </StarterShell>
  );
}
