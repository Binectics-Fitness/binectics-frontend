"use client";

import AppSidebar, { type NavItem, type RoleBadge } from "./AppSidebar";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  BookOpen,
  FileText,
  ClipboardList,
  DollarSign,
  Star,
  ShoppingBag,
} from "lucide-react";

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Overview",
    href: "/dashboard/dietitian",
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: "My Clients",
    href: "/dashboard/dietitian/clients",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: "Consultations",
    href: "/dashboard/dietitian/consultations",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    label: "Bookings",
    href: "/dashboard/dietitian/bookings",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    label: "Meal Plans",
    href: "/dashboard/dietitian/meal-plans",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Forms",
    href: "/forms",
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    label: "Nutrition Plans",
    href: "/dashboard/dietitian/nutrition-plans",
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    label: "Earnings",
    href: "/dashboard/dietitian/earnings",
  },
  {
    icon: <Star className="h-5 w-5" />,
    label: "Reviews & Ratings",
    href: "/dashboard/dietitian/reviews",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    label: "Marketplace",
    href: "/dashboard/marketplace",
  },
];

const roleBadge: RoleBadge = {
  label: "Dietitian",
  bgClass: "bg-dietitian-soft",
  textClass: "text-diet",
};

export default function DietitianSidebar() {
  return (
    <AppSidebar
      navItems={navItems}
      settingsHref="/dashboard/dietitian/settings"
      roleBadge={roleBadge}
    />
  );
}
