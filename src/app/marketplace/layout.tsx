import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace",
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
