"use client";

import { PageHeader } from "@/components/ds";
import { useSoloFlags } from "@/hooks/useSoloFlags";
import { SoloPage } from "../_components/solo/SoloPage";
import { ChecklistManager } from "../_components/solo/ChecklistManager";

export default function TodayListPage() {
  return (
    <SoloPage activeLabel="Today" flag="checklist" unavailableTitle="Your daily list is not available yet">
      <TodayListContent />
    </SoloPage>
  );
}

function TodayListContent() {
  const flags = useSoloFlags();
  return (
    <>
      <PageHeader title="Your daily list" subtitle="Pick the lines that show on Today, and the days they show." />
      <div style={{ maxWidth: 720 }}>
        <ChecklistManager showFasting={flags.fasting} />
      </div>
    </>
  );
}
