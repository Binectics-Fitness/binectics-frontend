"use client";

import { SoloPage } from "../../_components/solo/SoloPage";
import { FastStages } from "../../_components/solo/FastStages";

export default function FastingStagesRoute() {
  return (
    <SoloPage activeLabel="Fasting" flag="fasting" unavailableTitle="Fasting is not available yet">
      <FastStages />
    </SoloPage>
  );
}
