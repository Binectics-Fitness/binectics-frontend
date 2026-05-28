export interface CommandItem {
  id: string;
  label: string;
  section: "navigation" | "action" | "recent";
  href?: string;
  shortcut?: string;
  icon?: string;
}

export const NAVIGATION_COMMANDS: CommandItem[] = [
  { id: "home", label: "Home", section: "navigation", href: "/" },
  { id: "marketplace", label: "Marketplace", section: "navigation", href: "/marketplace" },
  { id: "dashboard", label: "Dashboard", section: "navigation", href: "/dashboard/member" },
  { id: "bookings", label: "My bookings", section: "navigation", href: "/dashboard/bookings" },
  { id: "messages", label: "Messages", section: "navigation", href: "/dashboard/messages" },
  { id: "calendar", label: "Calendar", section: "navigation", href: "/dashboard/calendar" },
  { id: "settings", label: "Settings", section: "navigation", href: "/dashboard/settings" },
  { id: "profile", label: "Edit profile", section: "navigation", href: "/dashboard/profile-edit" },
  { id: "billing", label: "Billing", section: "navigation", href: "/dashboard/member/billing" },
  { id: "help", label: "Help center", section: "navigation", href: "/help" },
];

export const ACTION_COMMANDS: CommandItem[] = [
  { id: "new-booking", label: "Book a session", section: "action" },
  { id: "search", label: "Search marketplace", section: "action", href: "/marketplace/search" },
  { id: "notifications", label: "Open notifications", section: "action" },
];
