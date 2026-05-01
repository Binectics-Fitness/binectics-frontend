import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Profile",
  description:
    "View personal trainer credentials, specialties, training plans, and verified client reviews.",
};

export default function TrainerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
