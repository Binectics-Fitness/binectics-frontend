import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Dietitians",
  description:
    "Find verified dietitians and nutrition coaches. Get personalized meal plans and nutrition guidance on Binectics.",
};

export default function DietitiansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
