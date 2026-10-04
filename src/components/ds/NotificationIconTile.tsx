import {
  AlertCircle,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarClock,
  CreditCard,
  Dumbbell,
  Gift,
  MessageCircle,
  ScanLine,
  Star,
  Target,
  UserPlus,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { notificationIcon, type NotificationIconKey } from "@/lib/ui/notificationIcon";
import { IconTile, type IconTileSize } from "./IconTile";

/** Same icons as the mobile notifications list. */
const ICONS: Record<NotificationIconKey, LucideIcon> = {
  meal: UtensilsCrossed,
  workout: Dumbbell,
  program: Target,
  journal: BookOpen,
  message: MessageCircle,
  booking: CalendarClock,
  payment: CreditCard,
  checkin: ScanLine,
  client: UserPlus,
  review: Star,
  team: Users,
  reward: Gift,
  verification: BadgeCheck,
  alert: AlertCircle,
  bell: Bell,
};

/**
 * The leading tile of a notification row: an icon for what it is about and a
 * tone for what it means (lib/ui/notificationIcon): confirmed or paid in
 * success, waiting on you in warn, refused in danger, a role's own content in
 * its accent, the rest neutral.
 */
export function NotificationIconTile({
  type,
  category,
  size = "md",
}: {
  type?: string | null;
  category?: string | null;
  size?: IconTileSize;
}) {
  const { icon, tone } = notificationIcon({ type, category });
  return <IconTile icon={ICONS[icon]} tone={tone} size={size} />;
}
