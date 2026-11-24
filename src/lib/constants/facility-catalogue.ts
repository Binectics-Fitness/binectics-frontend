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

/**
 * Gradient swatches for a facility with no photo. Every colour is a v2 token
 * from the `@theme` block in globals.css (`--color-<name>` gives `from-<name>`
 * and `to-<name>`), so a swatch can never point at a colour that is not
 * there. The preview draws a light icon (`text-bg`) on top, so each pair is a
 * mid or dark tone. Keys are stored on the facility item: never rename one.
 */
export const GRADIENT_OPTIONS: ReadonlyArray<{
  key: string;
  className: string;
  label: string;
}> = [
  { key: "blue-purple", className: "from-gym to-dietitian", label: "Blue → Purple" },
  { key: "blue-green", className: "from-gym to-signal", label: "Blue → Green" },
  { key: "purple-blue", className: "from-dietitian to-gym", label: "Purple → Blue" },
  { key: "yellow-orange", className: "from-trainer to-warn-ink", label: "Yellow → Orange" },
  { key: "neutral", className: "from-ink-2 to-ink", label: "Charcoal" },
  { key: "cyan", className: "from-water to-water-ink", label: "Cyan" },
  { key: "green-yellow", className: "from-signal to-trainer", label: "Green → Yellow" },
  { key: "neutral-blue", className: "from-fg-2 to-gym", label: "Slate → Blue" },
];

/**
 * Class strings an earlier version stored instead of a key. Their colour
 * names (`accent-blue-500`, `primary-500`, …) were removed with the v1 theme
 * and draw nothing, so each maps back to the swatch it was.
 */
const LEGACY_GRADIENT_CLASSES: Readonly<Record<string, string>> = {
  "from-accent-blue-500 to-accent-purple-500": "blue-purple",
  "from-accent-blue-500 to-primary-500": "blue-green",
  "from-accent-purple-500 to-accent-blue-500": "purple-blue",
  "from-accent-yellow-500 to-orange-500": "yellow-orange",
  "from-neutral-700 to-neutral-900": "neutral",
  "from-accent-blue-400 to-cyan-500": "cyan",
  "from-primary-500 to-accent-yellow-500": "green-yellow",
  "from-neutral-600 to-accent-blue-500": "neutral-blue",
};

export function getFacilityIcon(key?: string | null): LucideIcon {
  if (!key) return Dumbbell;
  return (
    FACILITY_ICON_OPTIONS.find((opt) => opt.key === key)?.icon ?? Dumbbell
  );
}

export function getFacilityGradient(key?: string | null): string {
  const fallback = GRADIENT_OPTIONS[0].className;
  if (!key) return fallback;
  const fromCatalog = GRADIENT_OPTIONS.find((g) => g.key === key);
  if (fromCatalog) return fromCatalog.className;
  // A class string saved by an earlier version: map it to its swatch. Any
  // other free-form string is not passed through, since Tailwind only builds
  // classes it finds in the source and an unknown one would draw nothing.
  const legacyKey = LEGACY_GRADIENT_CLASSES[key.trim().replace(/\s+/g, " ")];
  const legacy = legacyKey ? GRADIENT_OPTIONS.find((g) => g.key === legacyKey) : undefined;
  return legacy?.className ?? fallback;
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
