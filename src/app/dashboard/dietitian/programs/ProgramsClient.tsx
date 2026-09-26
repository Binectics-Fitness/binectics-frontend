"use client";

import ProgramsManager from "@/components/programs/ProgramsManager";
import { DIETITIAN_PROGRAMS_CONFIG } from "@/components/programs/config";

export default function ProgramsClient({
  initialCreateOpen = false,
  initialEditId,
}: {
  initialCreateOpen?: boolean;
  initialEditId?: string;
}) {
  return (
    <ProgramsManager
      config={DIETITIAN_PROGRAMS_CONFIG}
      initialCreateOpen={initialCreateOpen}
      initialEditId={initialEditId}
    />
  );
}
