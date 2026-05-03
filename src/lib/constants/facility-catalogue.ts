/**
 * Canonical catalogue of facility/amenity UI metadata. The source-of-truth
 * enums live in `@/lib/types`; this module just maps them to display labels,
 * lucide icons, and gradient classes used on the gym Facilities & Amenities
 * page.
 */

import {
  AmenityKey,
  FacilityCategory,
  FacilityCondition,
  FacilityStatus,
} from "@/lib/types";
import {
  Baby,
  Car,
  Clock,
  Coffee,
  Dumbbell,
  Flame,
  HeartPulse,
  Lock,
  ShowerHead,
  Shirt,
  Sparkles,
  UserCog,
  Users,
  Waves,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const AMENITY_CATALOGUE: ReadonlyArray<{
  key: AmenityKey;
  label: string;
  icon: LucideIcon;
}> = [
  { key: AmenityKey.WIFI, label: "WiFi", icon: Wifi },
  { key: AmenityKey.TOWEL_SERVICE, label: "Towel Service", icon: Shirt },
  {
    key: AmenityKey.PERSONAL_TRAINING,
    label: "Personal Training",
    icon: UserCog,
  },
  { key: AmenityKey.GROUP_CLASSES, label: "Group Classes", icon: Users },
  { key: AmenityKey.CHILDCARE, label: "Childcare", icon: Baby },
  { key: AmenityKey.ACCESS_24_7, label: "24/7 Access", icon: Clock },
  { key: AmenityKey.LOCKER_ROOMS, label: "Locker Rooms", icon: Lock },
  { key: AmenityKey.SHOWERS, label: "Showers", icon: ShowerHead },
  { key: AmenityKey.PARKING, label: "Parking", icon: Car },
  { key: AmenityKey.JUICE_BAR, label: "Juice Bar", icon: Coffee },
  { key: AmenityKey.SAUNA, label: "Sauna", icon: Flame },
  { key: AmenityKey.POOL, label: "Pool", icon: Waves },
  { key: AmenityKey.STEAM_ROOM, label: "Steam Room", icon: Wrench },
];

export const FACILITY_ICON_OPTIONS: ReadonlyArray<{
  key: string;
  icon: LucideIcon;
  label: string;
}> = [
  { key: "Dumbbell", icon: Dumbbell, label: "Dumbbell" },
  { key: "HeartPulse", icon: HeartPulse, label: "Cardio" },
  { key: "Sparkles", icon: Sparkles, label: "Studio" },
  { key: "Flame", icon: Flame, label: "Sauna" },
  { key: "Lock", icon: Lock, label: "Lockers" },
  { key: "ShowerHead", icon: ShowerHead, label: "Showers" },
  { key: "Coffee", icon: Coffee, label: "Cafe" },
  { key: "Car", icon: Car, label: "Parking" },
  { key: "Users", icon: Users, label: "Classes" },
  { key: "Waves", icon: Waves, label: "Pool" },
];

export const GRADIENT_OPTIONS: ReadonlyArray<{
  key: string;
  className: string;
  label: string;
}> = [
  {
    key: "blue-purple",
    className: "from-accent-blue-500 to-accent-purple-500",
    label: "Blue → Purple",
  },
  {
    key: "blue-green",
    className: "from-accent-blue-500 to-primary-500",
    label: "Blue → Green",
  },
  {
    key: "purple-blue",
    className: "from-accent-purple-500 to-accent-blue-500",
    label: "Purple → Blue",
  },
  {
    key: "yellow-orange",
    className: "from-accent-yellow-500 to-orange-500",
    label: "Yellow → Orange",
  },
  {
    key: "neutral",
    className: "from-neutral-700 to-neutral-900",
    label: "Charcoal",
  },
  {
    key: "cyan",
    className: "from-accent-blue-400 to-cyan-500",
    label: "Cyan",
  },
  {
    key: "green-yellow",
    className: "from-primary-500 to-accent-yellow-500",
    label: "Green → Yellow",
  },
  {
    key: "neutral-blue",
    className: "from-neutral-600 to-accent-blue-500",
    label: "Slate → Blue",
  },
];

export function getFacilityIcon(key?: string | null): LucideIcon {
  if (!key) return Dumbbell;
  return (
    FACILITY_ICON_OPTIONS.find((opt) => opt.key === key)?.icon ?? Dumbbell
  );
}

export function getFacilityGradient(key?: string | null): string {
  if (!key) return GRADIENT_OPTIONS[0].className;
  // Allow either a catalog key or a raw tailwind gradient string saved by an
  // earlier version.
  const fromCatalog = GRADIENT_OPTIONS.find((g) => g.key === key);
  if (fromCatalog) return fromCatalog.className;
  if (key.includes(" ") || key.startsWith("from-")) return key;
  return GRADIENT_OPTIONS[0].className;
}

export const FACILITY_CATEGORY_LABELS: Record<FacilityCategory, string> = {
  [FacilityCategory.EQUIPMENT]: "Equipment",
  [FacilityCategory.ROOM]: "Room",
  [FacilityCategory.AMENITY]: "Amenity",
  [FacilityCategory.SERVICE]: "Service",
};

export const FACILITY_STATUS_LABELS: Record<FacilityStatus, string> = {
  [FacilityStatus.AVAILABLE]: "Available",
  [FacilityStatus.MAINTENANCE]: "Maintenance",
};

export const FACILITY_CONDITION_LABELS: Record<FacilityCondition, string> = {
  [FacilityCondition.EXCELLENT]: "Excellent",
  [FacilityCondition.GOOD]: "Good",
  [FacilityCondition.FAIR]: "Fair",
};
