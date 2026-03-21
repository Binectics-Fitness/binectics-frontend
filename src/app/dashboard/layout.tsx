"use client";

import { ReactNode } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useAutoAcceptInvite } from "@/hooks/useAutoAcceptInvite";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Enable auto-logout for all dashboard pages (60 minutes of inactivity)
  useAutoLogout(60);

  // Auto-accept client invite if token was stored during registration flow
  useAutoAcceptInvite();

  // This layout wraps all dashboard pages
  // The global Navbar and Footer from root layout will be hidden for dashboard pages
  return <div className="dashboard-route">{children}</div>;
}
