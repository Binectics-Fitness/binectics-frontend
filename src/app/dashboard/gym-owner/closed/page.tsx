import type { Metadata } from "next";
import ClosedGymsClient from "./ClosedGymsClient";

export const metadata: Metadata = {
  title: "Closed gyms",
  description: "Reopen a closed gym within 30 days and download your records.",
};

export default function ClosedGymsPage() {
  return <ClosedGymsClient />;
}
