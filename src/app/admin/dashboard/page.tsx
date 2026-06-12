import type { Metadata } from "next";
import AdminOverviewClient from "./AdminOverviewClient";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Platform overview with key metrics, activity, and alerts.",
};

export default function AdminDashboard() {
  return <AdminOverviewClient />;
}
