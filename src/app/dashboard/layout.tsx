import type { Metadata } from "next";
import { ReactNode } from "react";
import DashboardClientShell from "@/components/DashboardClientShell";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardClientShell>{children}</DashboardClientShell>;
}
