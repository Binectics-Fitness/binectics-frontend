import { toneColors, type Tone } from "@/lib/ui/tones";

/**
 * StatusPill — the app's one status badge: a dot and a label on the tone's
 * soft fill, in the tone's ink (my-bookings.html / notifications.html
 * `.pill`): mono 11px, uppercase, 999px radius.
 *
 * `tone` is what the status MEANS, from src/lib/ui/tones.ts — pick it with a
 * helper in src/lib/ui/statusTones.ts rather than by hand:
 *   success  done, confirmed, paid, active
 *   warn     needs attention, nothing failed (awaiting payment, missed, open)
 *   danger   failed or blocked (failed payment, past due, suspended)
 *   gym / trainer / dietitian  which kind of provider, not a status
 *   neutral  everything else, including cancelled and expired
 */
interface StatusPillProps {
  label: string;
  tone?: Tone;
  /** Draw the leading dot. Defaults to true. */
  dot?: boolean;
  className?: string;
  title?: string;
}

export function StatusPill({ label, tone = "neutral", dot = true, className = "", title }: StatusPillProps) {
  const { fill, ink } = toneColors(tone);
  return (
    <span
      data-tone={tone}
      title={title}
      className={`inline-flex items-center gap-[5px] font-mono text-[11px] uppercase tracking-[0.05em] rounded-full whitespace-nowrap ${className}`}
      style={{ padding: "3px 9px", color: ink, background: fill }}
    >
      {dot && <span aria-hidden="true" className="w-[5px] h-[5px] rounded-full bg-current" />}
      {label}
    </span>
  );
}
