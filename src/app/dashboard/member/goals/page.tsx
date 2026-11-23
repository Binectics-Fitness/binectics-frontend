"use client";

import { SoloPage } from "../_components/solo/SoloPage";
import { GoalsPage } from "../_components/records/GoalsPage";

export default function GoalsRoute() {
  return (
    <SoloPage activeLabel="Log">
      <GoalsPage />
    </SoloPage>
  );
}
