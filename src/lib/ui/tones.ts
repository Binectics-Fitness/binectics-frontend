/**
 * The one set of meaning-carrying colours for icons, status pills and
 * avatars. Each tone is the design system's badge/pill pattern (shared.css
 * `.badge-*`, binectics/notifications.html `.pill.*`): a soft fill and a
 * darker foreground of the same hue. IconTile and StatusPill both read from
 * here, so a status means the same colour wherever it shows up. Mobile has
 * the same set (binectics-mobile src/theme/tones.ts).
 *
 * Meaning rules:
 *  - success   done, completed, paid, confirmed, ready (a submitted form
 *              waiting to be reviewed). Signal's only non-CTA use.
 *  - warn      needs attention but nothing failed: missed or overdue task,
 *              late, expiring soon, awaiting payment, a request waiting on
 *              the user.
 *  - danger    something failed or is blocked: payment failed, past due,
 *              suspended, refused. Cancelled or expired is NOT danger on its
 *              own; it is neutral unless the user has a problem to fix.
 *  - gym / trainer / dietitian
 *              the row is about that kind of provider (a gym membership,
 *              check-in or class; a trainer's session or program; a
 *              dietitian's consult or meal plan). Identity, not status.
 *  - neutral   navigation and menu rows, general information, empty states.
 *
 * Never colour chevrons, body or meta text, or dividers; use one tone family
 * per row; signal stays the only filled-button colour. People's initials are
 * neutral; a provider's avatar takes its role accent. Unread counts are
 * signal everywhere.
 */
export type Tone = "success" | "warn" | "danger" | "gym" | "trainer" | "dietitian" | "neutral";

export const TONES: readonly Tone[] = ["success", "warn", "danger", "gym", "trainer", "dietitian", "neutral"];

export type RoleTone = Extract<Tone, "gym" | "trainer" | "dietitian">;

/** `fill` is the soft background; `ink` is the icon or text colour drawn on it. */
export const TONE_COLORS: Record<Tone, { fill: string; ink: string }> = {
  success: { fill: "var(--signal-soft)", ink: "var(--signal-ink)" },
  warn: { fill: "var(--warn-soft)", ink: "var(--warn-ink)" },
  danger: { fill: "var(--danger-soft)", ink: "var(--danger)" },
  gym: { fill: "var(--gym-soft)", ink: "var(--gym)" },
  trainer: { fill: "var(--trainer-soft)", ink: "var(--trainer-ink)" },
  dietitian: { fill: "var(--dietitian-soft)", ink: "var(--dietitian)" },
  neutral: { fill: "var(--bg-3)", ink: "var(--fg-2)" },
};

export function toneColors(tone: Tone | undefined): { fill: string; ink: string } {
  return TONE_COLORS[tone ?? "neutral"] ?? TONE_COLORS.neutral;
}

/**
 * The role accent for a kind of provider. Accepts the spellings the API and
 * the app use (`gym`, `GYM`, `gym_owner`, `trainer`, `personal_trainer`,
 * `dietitian`, "Trainer"...). Anything else is not a provider: neutral.
 */
export function providerTone(kind: string | null | undefined): RoleTone | "neutral" {
  const k = (kind ?? "").toLowerCase();
  if (k.includes("gym")) return "gym";
  if (k.includes("diet")) return "dietitian";
  if (k.includes("trainer") || k === "coach") return "trainer";
  return "neutral";
}
