import type { Metadata } from "next";
import { StarterHome } from "@/components/starter/StarterHome";
import { StarterShell } from "./_shell";

export const metadata: Metadata = {
  title: "Starter program",
  description: "Your free beginner workout program: today's session, progress and settings.",
};

export default function StarterPage() {
  return (
    <StarterShell>
      <StarterHome />
    </StarterShell>
  );
}
