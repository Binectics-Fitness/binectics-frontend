import { Suspense } from "react";
import type { Metadata } from "next";
import { GymRequestsClient } from "./GymRequestsClient";

export const metadata: Metadata = {
  title: "Requests",
  description: "Answer the members who asked to join your gym from its marketplace listing.",
};

export default function GymRequestsPage() {
  return (
    <Suspense fallback={null}>
      <GymRequestsClient />
    </Suspense>
  );
}
