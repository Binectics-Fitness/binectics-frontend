"use client";

import AppSidebar, { type NavItem, type RoleBadge } from "./AppSidebar";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCog,
  GitBranch,
  QrCode,
  CalendarDays,
  Calendar,
  CalendarCheck,
  Building2,
  DollarSign,
  FileText,
  BarChart3,
  Star,
  ShoppingBag,
} from "lucide-react";

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Overview",
    href: "/dashboard/gym-owner",
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: "Members",
    href: "/dashboard/gym-owner/members",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    label: "Membership Plans",
    href: "/dashboard/gym-owner/plans",
  },
  {
    icon: <UserCog className="h-5 w-5" />,
    label: "Staff & Trainers",
    href: "/dashboard/gym-owner/staff",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    label: "Assignment Rules",
    href: "/dashboard/gym-owner/assignment-rules",
  },
  {
    icon: <QrCode className="h-5 w-5" />,
    label: "QR Check-ins",
    href: "/dashboard/gym-owner/checkins",
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    label: "Classes & Schedule",
    href: "/dashboard/gym-owner/classes",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: "Consultations",
    href: "/dashboard/gym-owner/consultations",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    label: "Bookings",
    href: "/dashboard/gym-owner/bookings",
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    label: "Locations & Facilities",
    href: "/dashboard/gym-owner/facility",
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    label: "Revenue & Billing",
    href: "/dashboard/gym-owner/revenue",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Forms",
    href: "/forms",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    label: "Analytics",
    href: "/dashboard/gym-owner/analytics",
  },
  {
    icon: <Star className="h-5 w-5" />,
    label: "Reviews & Ratings",
    href: "/dashboard/gym-owner/reviews",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    label: "Marketplace",
    href: "/dashboard/gym-owner/marketplace",
  },
];

const roleBadge: RoleBadge = {
  label: "Gym Owner",
  bgClass: "bg-gym-soft",
  textClass: "text-gym",
};

export default function GymOwnerSidebar() {
  return (
    <AppSidebar
      navItems={navItems}
      settingsHref="/dashboard/gym-owner/settings"
      roleBadge={roleBadge}
    />
  );
}
