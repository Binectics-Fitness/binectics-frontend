import type { Metadata } from "next";
import { Suspense } from "react";
import { RefundsClient } from "./RefundsClient";

export const metadata: Metadata = {
  title: "Refunds and disputes",
  description: "Refund payments, ask Binectics for refunds, set your cancellation policy and answer disputes.",
};

export default function RefundsPage() {
  return (
    <Suspense fallback={null}>
      <RefundsClient />
    </Suspense>
  );
}
