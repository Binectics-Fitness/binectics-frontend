"use client";

import AppSidebar, { type NavItem, type RoleBadge } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import {
  Home,
  Compass,
  ShoppingBag,
  CalendarCheck,
  Target,
  TrendingUp,
  BookOpen,
  Dumbbell,
  Apple,
  FileText,
  Calendar,
  Ticket,
  QrCode,
  Award,
} from "lucide-react";

const ROLE_BADGE_MAP: Partial<Record<UserRole, RoleBadge>> = {
  GYM_OWNER: {
    label: "Gym Owner",
    bgClass: "bg-gym-soft",
    textClass: "text-gym",
  },
  TRAINER: {
    label: "Personal Trainer",
    bgClass: "bg-trainer-soft",
    textClass: "text-trainer",
  },
  DIETITIAN: {
    label: "Dietitian",
    bgClass: "bg-dietitian-soft",
    textClass: "text-diet",
  },
};

const navItems: NavItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "For You",
    href: "/dashboard",
  },
  {
    icon: <Compass className="h-5 w-5" />,
    label: "Explore",
    href: "/dashboard/explore",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    label: "Marketplace",
    href: "/marketplace",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    label: "My Bookings",
    href: "/dashboard/bookings",
  },
  {
    icon: <Target className="h-5 w-5" />,
    label: "My Goals",
    href: "/dashboard/goals",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    label: "Progress",
    href: "/dashboard/progress",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    label: "My Journals",
    href: "/dashboard/journals",
  },
  {
    icon: <Dumbbell className="h-5 w-5" />,
    label: "Workouts",
    href: "/dashboard/workouts",
  },
  {
    icon: <Apple className="h-5 w-5" />,
    label: "Nutrition",
    href: "/dashboard/nutrition",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Forms",
    href: "/forms",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: "Schedule",
    href: "/dashboard/schedule",
  },
  {
    icon: <Ticket className="h-5 w-5" />,
    label: "Today's Free Pass",
    href: "/dashboard/free-pass",
  },
  {
    icon: <QrCode className="h-5 w-5" />,
    label: "Check-ins",
    href: "/dashboard/checkins",
  },
  {
    icon: <Award className="h-5 w-5" />,
    label: "Loyalty & Rewards",
    href: "/dashboard/loyalty",
  },
];

export default function DashboardSidebar() {
  const { user } = useAuth();
  const roleBadge = user?.role ? ROLE_BADGE_MAP[user.role] : undefined;

  return (
    <AppSidebar
      navItems={navItems}
      settingsHref="/dashboard/settings"
      roleBadge={roleBadge}
    />
  );
}
