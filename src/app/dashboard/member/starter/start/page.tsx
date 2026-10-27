import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StartFlow } from "@/components/starter/StartFlow";
import { AsyncSpinner } from "@/components/ds";
import { isStarterProgramEnabled } from "@/lib/starter/flag";
import { StarterShell } from "../_shell";

export const metadata: Metadata = {
  title: "Start a program",
  description: "Answer three questions, look over the first week, and start a free beginner program.",
};

export default function StartStarterPage() {
  if (!isStarterProgramEnabled()) notFound();
  return (
    <StarterShell>
      <Suspense fallback={<AsyncSpinner size="page" label="Loading" />}>
        <StartFlow />
      </Suspense>
    </StarterShell>
  );
}
