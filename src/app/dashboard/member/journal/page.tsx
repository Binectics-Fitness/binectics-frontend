"use client";

import { SoloPage } from "../_components/solo/SoloPage";
import { JournalPage } from "../_components/records/JournalPage";

export default function JournalRoute() {
  return (
    <SoloPage activeLabel="Log">
      <JournalPage />
    </SoloPage>
  );
}
