import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description: "Binectics legal documents, terms of service, and compliance information.",
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
