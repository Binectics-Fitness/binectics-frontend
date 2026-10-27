import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StarterSession } from "@/components/starter/StarterSession";
import { isStarterProgramEnabled } from "@/lib/starter/flag";
import { StarterShell } from "../../_shell";

export const metadata: Metadata = {
  title: "Starter session",
  description: "Do today's starter session: exercises, optional numbers, finish or skip.",
};

export default async function StarterSessionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isStarterProgramEnabled()) notFound();
  const { id } = await params;
  return (
    <StarterShell>
      <StarterSession occurrenceId={id} />
    </StarterShell>
  );
}
