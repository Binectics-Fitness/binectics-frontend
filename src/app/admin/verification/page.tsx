import type { Metadata } from "next";
import { VerificationQueueClient } from "./VerificationQueueClient";

export const metadata: Metadata = {
  title: "Verification",
  description: "Providers waiting for their documents to be reviewed, and the decisions on them",
};

export default function AdminVerificationPage() {
  return <VerificationQueueClient />;
}
