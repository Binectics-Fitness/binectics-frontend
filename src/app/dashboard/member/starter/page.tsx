import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StarterHome } from "@/components/starter/StarterHome";
import { isStarterProgramEnabled } from "@/lib/starter/flag";
import { StarterShell } from "./_shell";

export const metadata: Metadata = {
  title: "Starter program",
  description: "Your free beginner workout program: today's session, progress and settings.",
};

export default function StarterPage() {
  if (!isStarterProgramEnabled()) notFound();
  return (
    <StarterShell>
      <StarterHome />
    </StarterShell>
  );
}
