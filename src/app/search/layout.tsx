import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for gyms, personal trainers, and dietitians near you. Filter by location, price, and verified status.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
