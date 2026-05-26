import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check In",
  description: "Check in to your gym using your Binectics QR code.",
};

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
