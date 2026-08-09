"use client";

import ProgramInstanceView from "@/components/programs/ProgramInstanceView";
import { TRAINER_PROGRAMS_CONFIG } from "@/components/programs/config";

export default function InstanceClient({ instanceId }: { instanceId: string }) {
  return <ProgramInstanceView config={TRAINER_PROGRAMS_CONFIG} instanceId={instanceId} />;
}
