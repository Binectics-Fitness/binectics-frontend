import type { Metadata } from "next";
import AdminClientShell from "@/components/AdminClientShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminClientShell>{children}</AdminClientShell>;
}
