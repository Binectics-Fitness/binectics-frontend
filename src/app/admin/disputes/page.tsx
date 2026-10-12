import type { Metadata } from "next";
import { AdminDisputesClient } from "./AdminDisputesClient";

export const metadata: Metadata = {
  title: "Disputes",
  description: "Disputed payments and chargebacks",
};

export default function AdminDisputesPage() {
  return <AdminDisputesClient />;
}
