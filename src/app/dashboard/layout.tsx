'use client';

import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // This layout wraps all dashboard pages
  // The global Navbar and Footer from root layout will be hidden for dashboard pages
  return <>{children}</>;
}
