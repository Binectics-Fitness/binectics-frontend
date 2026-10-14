import { LayoutDashboard, Settings, User as UserIcon, type LucideIcon } from "lucide-react";
import { getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";

export interface AccountMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The account links in the marketing nav's avatar menu and phone drawer.
 * One list, so the two can't disagree: the drawer used to build
 * `${dashboard}/profile` and `${dashboard}/settings`, which 404 for members,
 * gym owners and admins. The account settings hub is real for every role.
 */
export function accountMenuItems(user: { role: UserRole; is_admin?: boolean }): AccountMenuItem[] {
  return [
    { href: getDashboardRoute(user.role), label: "Dashboard", icon: LayoutDashboard },
    // Platform admins (is_admin flag, orthogonal to role) get a way into
    // the admin panel without giving up their own role's dashboard.
    ...(user.is_admin && user.role !== UserRole.ADMIN
      ? [{ href: "/admin/dashboard", label: "Admin panel", icon: LayoutDashboard }]
      : []),
    { href: "/dashboard/settings/profile", label: "Profile", icon: UserIcon },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
}
