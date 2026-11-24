"use client";

import { SoloPage } from "../_components/solo/SoloPage";
import { HistoryPage } from "../_components/records/HistoryPage";

export default function HistoryRoute() {
  return (
    <SoloPage activeLabel="Log">
      <HistoryPage />
    </SoloPage>
  );
}
