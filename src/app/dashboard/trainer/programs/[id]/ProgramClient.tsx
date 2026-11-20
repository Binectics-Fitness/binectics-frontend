"use client";

import ProgramBuilderPage from "@/components/programs/builder/ProgramBuilderPage";
import { TRAINER_PROGRAMS_CONFIG } from "@/components/programs/config";

export default function ProgramClient({ id }: { id: string }) {
  return <ProgramBuilderPage config={TRAINER_PROGRAMS_CONFIG} id={id} />;
}
