import { GymTaxClient } from "./GymTaxClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax",
  description: "Tax settings and an estimate from recorded revenue.",
};

export default function GymTaxPage() {
  return <GymTaxClient />;
}
