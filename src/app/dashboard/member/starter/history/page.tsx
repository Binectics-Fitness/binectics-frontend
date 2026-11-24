import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StarterHistory } from "@/components/starter/StarterHistory";
import { isStarterProgramEnabled } from "@/lib/starter/flag";
import { StarterShell } from "../_shell";

export const metadata: Metadata = {
  title: "Your history",
  description: "Your starter program week by week: sessions done, done late, skipped or missed, and the numbers you logged.",
};

export default function StarterHistoryPage() {
  if (!isStarterProgramEnabled()) notFound();
  return (
    <StarterShell>
      <StarterHistory />
    </StarterShell>
  );
}
