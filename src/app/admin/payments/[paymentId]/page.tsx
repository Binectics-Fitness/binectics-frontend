import type { Metadata } from "next";
import { PaymentDetailClient } from "./PaymentDetailClient";

export const metadata: Metadata = {
  title: "Payment Details",
  description: "One ledger row with its payer, organization and what it paid for.",
};

export default async function AdminSinglePaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  return <PaymentDetailClient paymentId={paymentId} />;
}
