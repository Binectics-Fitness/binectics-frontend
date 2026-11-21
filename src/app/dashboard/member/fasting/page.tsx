"use client";

import { SoloPage } from "../_components/solo/SoloPage";
import { FastingContent } from "../_components/solo/FastingPage";

export default function FastingPageRoute() {
  return (
    <SoloPage activeLabel="Fasting">
      <FastingContent />
    </SoloPage>
  );
}
