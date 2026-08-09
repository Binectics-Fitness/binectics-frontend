import type { ComponentType, ReactNode } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

/**
 * Role wiring for the shared Programs (Protocols) UI. The manager and instance
 * views are identical across provider roles; only the dashboard shell, the
 * route namespace, and the accent tokens differ.
 */
export interface ProgramsRoleConfig {
  /** Provider dashboard shell (same prop shape across roles). */
  Shell: ComponentType<{
    activeItem: string;
    crumb: string;
    actions?: ReactNode;
    children: ReactNode;
  }>;
  /** Sidebar item + breadcrumb label. */
  navItem: string;
  /** Route base, e.g. /dashboard/dietitian/programs. */
  basePath: string;
  /** Accent used as text on light fills (must be legible, not the raw pastel). */
  accentInk: string;
  /** Accent soft fill for badges. */
  accentSoft: string;
}

export const DIETITIAN_PROGRAMS_CONFIG: ProgramsRoleConfig = {
  Shell: DietitianDashboardShell,
  navItem: "Programs",
  basePath: "/dashboard/dietitian/programs",
  accentInk: "var(--dietitian)",
  accentSoft: "var(--dietitian-soft)",
};

export const TRAINER_PROGRAMS_CONFIG: ProgramsRoleConfig = {
  Shell: TrainerDashboardShell,
  navItem: "Programs",
  basePath: "/dashboard/trainer/programs",
  // --trainer (0.72 L) is too light for text; use the badge ink like badge-trainer.
  accentInk: "oklch(0.45 0.12 75)",
  accentSoft: "var(--trainer-soft)",
};
