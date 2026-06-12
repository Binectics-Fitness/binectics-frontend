import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking",
  description: "Book sessions with trainers, dietitians, and gyms on Binectics.",
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
