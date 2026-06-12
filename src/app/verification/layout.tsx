import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification",
  description: "Verify your credentials and get your Binectics provider badge.",
};

export default function VerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
