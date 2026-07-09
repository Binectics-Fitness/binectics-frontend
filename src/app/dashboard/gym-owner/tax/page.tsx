import { GymTaxClient } from "./GymTaxClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax",
  description: "View tax summaries, withholding, and download tax documents.",
};

export default function GymTaxPage() {
  return <GymTaxClient />;
}
