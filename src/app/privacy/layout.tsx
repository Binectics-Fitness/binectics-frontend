import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the Binectics privacy policy and learn how we protect your data.",
  // Inherited by everything under this layout: only safe while the page is
  // its sole child. A nested route must declare its own canonical.
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
