import { GymReviewsClient } from "./GymReviewsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Read and respond to member reviews of your gym.",
};

export default function GymReviewsPage() {
  return <GymReviewsClient />;
}
