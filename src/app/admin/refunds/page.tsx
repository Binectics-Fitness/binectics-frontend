import type { Metadata } from "next";
import { AdminRefundsClient } from "./AdminRefundsClient";

export const metadata: Metadata = {
  title: "Refunds",
  description: "Refund requests and refunds of platform-collected money.",
};

export default function AdminRefundsPage() {
  return <AdminRefundsClient />;
}
