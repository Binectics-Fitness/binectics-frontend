import type { Metadata } from "next";
import PaymentsClient from "./PaymentsClient";

export const metadata: Metadata = {
  title: "Payments",
  description: "What you owe, what you have paid, and your receipts",
};

export default function MemberPaymentsPage() {
  return <PaymentsClient />;
}
