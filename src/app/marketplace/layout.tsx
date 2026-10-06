import type { Metadata } from "next";

export const metadata: Metadata = {
  // An object, not a string: a string title here would drop the root
  // layout's template for every page below, and a profile's title would
  // lose its ", Binectics".
  title: { default: "Marketplace", template: "%s, Binectics" },
  description:
    "Explore the Binectics fitness marketplace. Browse gyms, trainers, and dietitians with verified profiles and flexible subscription plans.",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
