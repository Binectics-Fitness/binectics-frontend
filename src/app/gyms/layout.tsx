import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Gyms",
  description:
    "Find and browse verified gyms near you in 50+ countries. Compare facilities, membership plans, and check-in options on Binectics.",
};

export default function GymsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
