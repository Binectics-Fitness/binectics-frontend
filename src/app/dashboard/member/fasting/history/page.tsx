"use client";

import { SoloPage } from "../../_components/solo/SoloPage";
import { FastHistory } from "../../_components/solo/FastHistory";

export default function FastingHistoryRoute() {
  return (
    <SoloPage activeLabel="Fasting">
      <FastHistory />
    </SoloPage>
  );
}
