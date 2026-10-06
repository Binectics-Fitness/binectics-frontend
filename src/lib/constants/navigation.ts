import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  QrCode,
  BookOpen,
  Globe,
  Dumbbell,
  Users,
  Heart,
  Apple,
  Building2,
  Mail,
} from "lucide-react";

export interface DropdownItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export interface DropdownGroup {
  title: string;
  items: DropdownItem[];
}

export interface DropdownEntry {
  kind: "dropdown";
  label: string;
  groups: DropdownGroup[];
  width: number;
  columns: number;
  align?: "left" | "right";
}

export interface LinkEntry {
  kind: "link";
  label: string;
  href: string;
}

export type NavEntry = LinkEntry | DropdownEntry;

export const NAV_ENTRIES: NavEntry[] = [
  {
    kind: "dropdown",
    label: "Product",
    width: 480,
    columns: 2,
    align: "left",
    groups: [
      {
        title: "Platform",
        items: [
          { label: "Dashboard", description: "Manage everything in one place", href: "/features/dashboard", icon: LayoutDashboard },
          { label: "QR Check-in", description: "Touchless attendance tracking", href: "/features/qr-checkin", icon: QrCode },
          { label: "Client Journals", description: "Track progress and notes", href: "/features/client-journals", icon: BookOpen },
          { label: "Multi-Currency", description: "Accept payments worldwide", href: "/features/multi-currency", icon: Globe },
        ],
      },
      {
        title: "For You",
        items: [
          { label: "Gym Owners", description: "Manage facilities and members", href: "/for-gyms", icon: Dumbbell },
          { label: "Personal Trainers", description: "Build your client base", href: "/for-trainers", icon: Users },
          { label: "Dietitians", description: "Create meal plans and consult", href: "/for-dietitians", icon: Apple },
          { label: "Members", description: "Find and book providers", href: "/for-members", icon: Heart },
        ],
      },
    ],
  },
  { kind: "link", label: "Marketplace", href: "/marketplace" },
  { kind: "link", label: "Pricing", href: "/pricing" },
  {
    kind: "dropdown",
    label: "Company",
    width: 480,
    columns: 2,
    align: "right",
    groups: [
      {
        title: "Company",
        items: [
          { label: "About", description: "Why we're building Binectics", href: "/about", icon: Building2 },
        ],
      },
      {
        title: "Resources",
        items: [
          { label: "Contact", description: "Get in touch", href: "/contact", icon: Mail },
        ],
      },
    ],
  },
];
