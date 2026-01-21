'use client';

import { ReactNode } from 'react';
import { useAutoLogout } from '@/hooks/useAutoLogout';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Enable auto-logout for all dashboard pages (60 minutes of inactivity)
  useAutoLogout(60);

  // This layout wraps all dashboard pages
  // The global Navbar and Footer from root layout will be hidden for dashboard pages
  return <>{children}</>;
}
