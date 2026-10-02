import { Suspense } from "react";
import type { Metadata } from "next";
import RateLimitNotice from "./RateLimitNotice";

export const metadata: Metadata = {
  title: "Too Many Requests",
  description: "Too many requests in a short time. Wait a moment and try again.",
};

export default function RateLimitPage() {
  return (
    <Suspense fallback={null}>
      <RateLimitNotice />
    </Suspense>
  );
}
