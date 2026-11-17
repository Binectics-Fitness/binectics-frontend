"use client";

import { SoloPage } from "../_components/solo/SoloPage";
import { ProgressContent } from "../_components/solo/ProgressPage";

export default function ProgressRoute() {
  return (
    <SoloPage activeLabel="Progress" flag="history" unavailableTitle="Progress is not available yet">
      <ProgressContent />
    </SoloPage>
  );
}
