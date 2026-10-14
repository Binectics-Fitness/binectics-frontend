import type { ReactNode } from "react";
import { UserRole } from "@/lib/types";
import { getDashboardRoute } from "@/lib/constants/routes";

export interface CommandItem {
  id: string;
  label: string;
  section: "navigation" | "action" | "help";
  /** Every command goes somewhere: one without a destination would do nothing. */
  href: string;
  meta?: string;
  /** A single SVG path, drawn in the command's icon tile. */
  icon: string;
  /** A ready-made icon (a shell's sidebar icon) in place of `icon`. */
  iconNode?: ReactNode;
}

const ICON = {
  home: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  marketplace: "M3 9h18M9 21V9",
  bookings: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  messages: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8",
  plus: "M12 5v14M5 12h14",
  help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  support: "M3 21l1.6-4.7A9 9 0 1 1 12 21z",
} as const;

const PROVIDER_MESSAGES: Partial<Record<UserRole, string>> = {
  [UserRole.TRAINER]: "/dashboard/trainer/messages",
  [UserRole.DIETITIAN]: "/dashboard/dietitian/messages",
  [UserRole.GYM_OWNER]: "/dashboard/gym-owner/messages",
};

/**
 * Where the command bar can take someone when no dashboard shell is on
 * screen (marketing pages, account settings). Inside a shell the bar offers
 * that shell's own sidebar instead, plus the account entries below.
 */
export function defaultNavigationCommands(role: UserRole | null | undefined): CommandItem[] {
  const marketplace: CommandItem = { id: "marketplace", label: "Marketplace", section: "navigation", href: "/marketplace", icon: ICON.marketplace };
  if (!role) return [marketplace];
  const home: CommandItem = { id: "home", label: "Dashboard", section: "navigation", href: getDashboardRoute(role), icon: ICON.home };
  if (role === UserRole.USER) {
    return [
      home,
      marketplace,
      { id: "bookings", label: "My bookings", section: "navigation", href: "/dashboard/bookings", icon: ICON.bookings },
      { id: "messages", label: "Messages", section: "navigation", href: "/dashboard/messages", icon: ICON.messages },
      ...accountCommands(),
    ];
  }
  const messages = PROVIDER_MESSAGES[role];
  return [
    home,
    ...(messages ? [{ id: "messages", label: "Messages", section: "navigation" as const, href: messages, icon: ICON.messages }] : []),
    ...accountCommands(),
    marketplace,
  ];
}

/** Account-wide places every signed-in person has, whatever their role. */
export function accountCommands(): CommandItem[] {
  return [
    { id: "notifications", label: "Notifications", section: "navigation", href: "/dashboard/notifications", icon: ICON.bell },
    { id: "account-settings", label: "Account settings", section: "navigation", href: "/dashboard/settings", icon: ICON.settings },
  ];
}

/**
 * Quick actions for the signed-in role. Each lands where the action is done:
 * `?new=1` opens a builder straight away where the page supports it, and
 * the rest open the page whose main button does it. A gym's staff trainer
 * gets no client invites or plans, which are the gym's.
 */
export function actionCommandsFor(role: UserRole | null | undefined, opts: { gymTrainer?: boolean } = {}): CommandItem[] {
  const action = (id: string, label: string, href: string): CommandItem => ({ id, label, section: "action", href, icon: ICON.plus });
  switch (role) {
    case UserRole.TRAINER:
      return [
        ...(opts.gymTrainer ? [] : [action("invite-client", "Invite a client", "/dashboard/trainer/clients")]),
        action("new-program", "New program", "/dashboard/trainer/programs?new=1"),
        ...(opts.gymTrainer ? [] : [action("new-plan", "New plan", "/dashboard/trainer/plans")]),
        action("block-off-time", "Block off time", "/dashboard/trainer/settings"),
      ];
    case UserRole.DIETITIAN:
      return [
        action("new-meal-plan", "New meal plan", "/dashboard/dietitian/meal-plans?new=1"),
        action("new-program", "New program", "/dashboard/dietitian/programs?new=1"),
        action("block-off-time", "Block off time", "/dashboard/dietitian/settings"),
      ];
    case UserRole.GYM_OWNER:
      return [
        action("new-class", "New class", "/dashboard/gym-owner/schedule"),
        action("new-membership-plan", "New membership plan", "/dashboard/gym-owner/plans"),
        action("add-staff", "Add staff", "/dashboard/gym-owner/staff"),
      ];
    default:
      return [];
  }
}

export const HELP_COMMANDS: CommandItem[] = [
  { id: "help-center", label: "Help center", section: "help", href: "/help", icon: ICON.help },
  { id: "contact-support", label: "Contact support", section: "help", href: "/contact", icon: ICON.support },
];
