import { BillingClient } from "./BillingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your memberships and payments.",
};

export default function MemberBillingPage() {
  return <BillingClient />;
}
