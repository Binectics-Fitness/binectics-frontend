import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your Binectics account as a member, gym owner, trainer, or dietitian.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
