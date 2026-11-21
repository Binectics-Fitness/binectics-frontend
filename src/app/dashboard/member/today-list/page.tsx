"use client";

import { PageHeader } from "@/components/ds";
import { SoloPage } from "../_components/solo/SoloPage";
import { ChecklistManager } from "../_components/solo/ChecklistManager";

export default function TodayListPage() {
  return (
    <SoloPage activeLabel="Today">
      <TodayListContent />
    </SoloPage>
  );
}

function TodayListContent() {
  return (
    <>
      <PageHeader title="Your daily list" subtitle="Pick the lines that show on Today, and the days they show." />
      <div style={{ maxWidth: 720 }}>
        <ChecklistManager />
      </div>
    </>
  );
}
