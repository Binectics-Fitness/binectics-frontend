"use client";

/**
 * WorkspaceShell — renders a provider feature inside the CURRENT user's own
 * dashboard chrome.
 *
 * Some features (e.g. Forms) are shared across provider roles — gym owner,
 * trainer, dietitian, and admin all use them, but each role has its own
 * dashboard shell. This component picks the right shell by role so the page
 * keeps the navigation the user expects. It is NOT for members: provider
 * features should not appear in the member experience.
 */

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import { GymDashboardShell } from "./GymDashboardShell";
import { TrainerDashboardShell } from "./TrainerDashboardShell";
import { DietitianDashboardShell } from "./DietitianDashboardShell";
import { AdminDashboardShell } from "./AdminDashboardShell";

interface WorkspaceShellProps {
  /** Must match the corresponding nav item `name` in each provider shell. */
  activeItem: string;
  crumb: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function WorkspaceShell({ activeItem, crumb, actions, children }: WorkspaceShellProps) {
  const { user, isLoading } = useAuth();
  const common = { activeItem, crumb, actions };

  // Avoid briefly rendering the wrong role's chrome before auth resolves.
  if (isLoading) return null;

  switch (user?.role) {
    case UserRole.TRAINER:
      return <TrainerDashboardShell {...common}>{children}</TrainerDashboardShell>;
    case UserRole.DIETITIAN:
      return <DietitianDashboardShell {...common}>{children}</DietitianDashboardShell>;
    case UserRole.ADMIN:
      return <AdminDashboardShell {...common}>{children}</AdminDashboardShell>;
    case UserRole.GYM_OWNER:
    default:
      // Gym owner is the default provider chrome.
      return <GymDashboardShell {...common}>{children}</GymDashboardShell>;
  }
}
