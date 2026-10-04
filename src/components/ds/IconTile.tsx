import type { LucideIcon } from "lucide-react";
import { toneColors, type Tone } from "@/lib/ui/tones";

/**
 * A lucide icon (or a person's initials) on a soft-filled circle, coloured by
 * what it means. Use it for the leading icon of a list row, a status line or
 * an empty state, so colour carries the same meaning across the app:
 *
 *  - success   done, completed, paid, confirmed, ready to review
 *  - warn      needs attention, nothing failed: missed, overdue, late,
 *              awaiting payment, a request waiting on the user
 *  - danger    failed or blocked: payment failed, past due, suspended,
 *              refused. Cancelled/expired alone is neutral.
 *  - gym / trainer / dietitian
 *              the row is about that kind of provider (identity, not status)
 *  - neutral   menus, navigation, general information, empty states
 *
 * People's initials are neutral; a provider's avatar takes its role accent.
 * Chevrons, body text and dividers are never toned, and a row uses one tone
 * family. The rules and colour pairs live in src/lib/ui/tones.ts.
 *
 * Decorative by default: the row's text says what the icon means, so the
 * tile is hidden from screen readers. Pass `label` when the tile stands alone.
 */
export type IconTileSize = "sm" | "md" | "lg";

/** sm for dense rows, md for list rows, lg only for empty states. */
const SIZES: Record<IconTileSize, { box: number; icon: number; text: number }> = {
  sm: { box: 28, icon: 14, text: 11 },
  md: { box: 36, icon: 18, text: 12 },
  lg: { box: 56, icon: 28, text: 16 },
};

interface IconTileProps {
  /** A lucide icon. Omit it to draw `initials` (or children) instead. */
  icon?: LucideIcon;
  /** Up to two letters for a person or provider avatar. */
  initials?: string;
  tone?: Tone;
  size?: IconTileSize;
  /** Accessible name; without it the tile is decorative. */
  label?: string;
  className?: string;
  /** Escape hatch for an inline SVG. It inherits the tone's ink via currentColor. */
  children?: React.ReactNode;
}

export function IconTile({
  icon: Icon,
  initials,
  tone = "neutral",
  size = "md",
  label,
  className = "",
  children,
}: IconTileProps) {
  const { fill, ink } = toneColors(tone);
  const s = SIZES[size];
  return (
    <span
      data-tone={tone}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${className}`}
      style={{ width: s.box, height: s.box, background: fill, color: ink, fontSize: s.text }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Icon ? <Icon size={s.icon} strokeWidth={1.75} aria-hidden="true" /> : initials ? initials.slice(0, 2).toUpperCase() : children}
    </span>
  );
}
