import React from "react";
import type { Metadata } from "next";
import { ReviewDetailClient } from "./ReviewDetailClient";

export const metadata: Metadata = {
  title: "Review",
  description: "A reported review, its reports, and the moderation actions",
};

export default function AdminSingleReviewPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = React.use(params);
  return <ReviewDetailClient reviewId={reviewId} />;
}
