import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gym Profile",
  description:
    "View gym facilities, photos, membership plans, member reviews, and verified credentials.",
};

export default function GymDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
