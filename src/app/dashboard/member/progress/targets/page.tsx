"use client";

import { SoloPage } from "../../_components/solo/SoloPage";
import { TargetsContent } from "../../_components/solo/TargetsPage";

export default function TargetsRoute() {
  return (
    <SoloPage activeLabel="Progress" flag="targets" unavailableTitle="Targets are not available yet">
      <TargetsContent />
    </SoloPage>
  );
}
