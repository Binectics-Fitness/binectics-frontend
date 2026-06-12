export interface CommandItem {
  id: string;
  label: string;
  section: "navigation" | "action" | "help";
  href?: string;
  meta?: string;
  icon: string;
}

export const NAVIGATION_COMMANDS: CommandItem[] = [
  { id: "marketplace", label: "Marketplace", section: "navigation", href: "/marketplace", meta: "G M", icon: "M3 9h18M9 21V9" },
  { id: "bookings", label: "My bookings", section: "navigation", href: "/dashboard/bookings", meta: "G B", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" },
  { id: "messages", label: "Messages", section: "navigation", href: "/dashboard/messages", meta: "G I", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { id: "settings", label: "Settings", section: "navigation", href: "/member/settings", meta: "G S", icon: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" },
];

export const ACTION_COMMANDS: CommandItem[] = [
  { id: "new-plan", label: "New plan", section: "action", meta: "⌘ N", icon: "M12 5v14M5 12h14" },
  { id: "book-session", label: "Book session", section: "action", meta: "⌘ B", icon: "M12 5v14M5 12h14" },
  { id: "invite-client", label: "Invite client", section: "action", icon: "M12 5v14M5 12h14" },
  { id: "block-off-time", label: "Block off time", section: "action", icon: "M12 5v14M5 12h14" },
];

export const HELP_COMMANDS: CommandItem[] = [
  { id: "help-center", label: "Help center", section: "help", href: "/help", icon: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" },
  { id: "contact-support", label: "Contact support", section: "help", href: "/contact", icon: "M3 21l1.6-4.7A9 9 0 1 1 12 21z" },
];
