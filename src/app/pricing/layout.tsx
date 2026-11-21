import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Binectics plans for gyms, trainers and dietitians, priced per seat in naira. Members join free and pay each provider's own prices.",
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
