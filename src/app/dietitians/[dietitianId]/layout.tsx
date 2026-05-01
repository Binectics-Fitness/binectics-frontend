import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dietitian Profile",
  description:
    "View dietitian credentials, nutrition specialties, plans, and verified client reviews.",
};

export default function DietitianDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
