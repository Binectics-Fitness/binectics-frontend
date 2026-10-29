import type { Metadata } from "next";
import PurchasesClient from "./PurchasesClient";

export const metadata: Metadata = {
  title: "My purchases",
  description: "Programs and meal plans you bought, were given, or get through a plan",
};

export default function MemberPurchasesPage() {
  return <PurchasesClient />;
}
