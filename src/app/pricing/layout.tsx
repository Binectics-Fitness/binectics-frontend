import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Binectics pricing: free to list, one transparent platform fee on processed payments, and provider plans with flexible monthly and annual billing.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
