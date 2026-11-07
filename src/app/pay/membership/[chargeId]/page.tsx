import type { Metadata } from "next";
import PayMembershipClient from "./PayMembershipClient";

export const metadata: Metadata = {
  title: "Pay your gym",
  description: "Pay what your gym says you owe",
  robots: { index: false, follow: false },
};

export default async function PayMembershipPage({ params }: { params: Promise<{ chargeId: string }> }) {
  const { chargeId } = await params;
  return <PayMembershipClient chargeId={chargeId} />;
}
