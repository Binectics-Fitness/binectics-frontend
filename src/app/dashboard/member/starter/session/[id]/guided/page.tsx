import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidedSession } from "@/components/guided/GuidedSession";
import { isStarterProgramEnabled } from "@/lib/starter/flag";
import { GuidedShell } from "./_shell";

export const metadata: Metadata = {
  title: "Guided session",
  description: "A guided starter session: get ready, timed sets and rests, with an optional voice coach.",
};

export default async function GuidedSessionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isStarterProgramEnabled()) notFound();
  const { id } = await params;
  return (
    <GuidedShell>
      <GuidedSession occurrenceId={id} />
    </GuidedShell>
  );
}
