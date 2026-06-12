"use client";

import AppSidebar, { type NavItem, type RoleBadge } from "./AppSidebar";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  CalendarCheck,
  CalendarClock,
  Dumbbell,
  Library,
  FileText,
  DollarSign,
  Star,
  ShoppingBag,
} from "lucide-react";

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Overview",
    href: "/dashboard/trainer",
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: "My Clients",
    href: "/dashboard/trainer/clients",
  },
  {
    icon: <CalendarRange className="h-5 w-5" />,
    label: "Consultations",
    href: "/dashboard/trainer/consultations",
  },
  {
    icon: <CalendarClock className="h-5 w-5" />,
    label: "Sessions & Schedule",
    href: "/dashboard/trainer/sessions",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    label: "Bookings",
    href: "/dashboard/trainer/bookings",
  },
  {
    icon: <Dumbbell className="h-5 w-5" />,
    label: "Workout Plans",
    href: "/dashboard/trainer/workouts",
  },
  {
    icon: <Library className="h-5 w-5" />,
    label: "Exercise Library",
    href: "/dashboard/trainer/exercises",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Forms",
    href: "/forms",
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    label: "Earnings",
    href: "/dashboard/trainer/earnings",
  },
  {
    icon: <Star className="h-5 w-5" />,
    label: "Reviews & Ratings",
    href: "/dashboard/trainer/reviews",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    label: "Marketplace",
    href: "/dashboard/marketplace",
  },
];

const roleBadge: RoleBadge = {
  label: "Personal Trainer",
  bgClass: "bg-trainer-soft",
  textClass: "text-trainer",
};

export default function TrainerSidebar() {
  return (
    <AppSidebar
      navItems={navItems}
      settingsHref="/dashboard/trainer/settings"
      roleBadge={roleBadge}
    />
  );
}
