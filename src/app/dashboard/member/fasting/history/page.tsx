"use client";

import { SoloPage } from "../../_components/solo/SoloPage";
import { FastHistory } from "../../_components/solo/FastHistory";

export default function FastingHistoryRoute() {
  return (
    <SoloPage activeLabel="Fasting" flag="fasting" unavailableTitle="Fasting is not available yet">
      <FastHistory />
    </SoloPage>
  );
}
