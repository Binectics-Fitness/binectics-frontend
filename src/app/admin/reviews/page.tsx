import type { Metadata } from "next";
import { ReviewReportsClient } from "./ReviewReportsClient";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Reports members filed on reviews, and the decisions on them",
};

export default function AdminReviewsPage() {
  return <ReviewReportsClient />;
}
