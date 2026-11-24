import React from "react";
import type { Metadata } from "next";
import { VerificationDetailClient } from "./VerificationDetailClient";

export const metadata: Metadata = {
  title: "Verification review",
  description: "A provider's verification documents and the decision on them",
};

export default function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ subjectType: string; subjectId: string }>;
}) {
  const { subjectType, subjectId } = React.use(params);
  return <VerificationDetailClient subjectType={subjectType} subjectId={subjectId} />;
}
