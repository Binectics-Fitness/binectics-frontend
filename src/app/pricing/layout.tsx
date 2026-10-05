import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Explore Binectics pricing plans, Explorer, Athlete, and Professional tiers with flexible monthly and annual billing.",
  // Inherited by everything under this layout: only safe while the page is
  // its sole child. A nested route must declare its own canonical.
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
