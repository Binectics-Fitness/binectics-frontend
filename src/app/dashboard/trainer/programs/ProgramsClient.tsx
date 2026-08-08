"use client";

import ProgramsManager from "@/components/programs/ProgramsManager";
import { TRAINER_PROGRAMS_CONFIG } from "@/components/programs/config";

export default function ProgramsClient({ initialCreateOpen = false }: { initialCreateOpen?: boolean }) {
  return <ProgramsManager config={TRAINER_PROGRAMS_CONFIG} initialCreateOpen={initialCreateOpen} />;
}
