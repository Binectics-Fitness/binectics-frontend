import { Suspense } from "react";
import type { Metadata } from "next";
import SessionExpiredNotice from "./SessionExpiredNotice";

export const metadata: Metadata = {
  title: "Session Expired",
  description: "Your Binectics session has ended. Please sign in again.",
};

export default function SessionExpiredPage() {
  return (
    <Suspense fallback={null}>
      <SessionExpiredNotice />
    </Suspense>
  );
}
