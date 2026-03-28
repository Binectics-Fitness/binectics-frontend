import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Trainers",
  description:
    "Discover certified personal trainers worldwide. Browse specialties, read reviews, and subscribe to training plans on Binectics.",
};

export default function TrainersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
