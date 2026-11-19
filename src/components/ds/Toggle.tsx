"use client";

/**
 * Toggle: an on/off switch. 52x32 track (border-2 off, ink on) with a paper
 * knob that slides 20px (transform, 200ms out-expo) while the track
 * crossfades; reduced motion is instant (10-System, mobile Toggle tone
 * "ink"). The hit area is 52x44.
 */
export function Toggle({
  on,
  label,
  onChange,
  disabled,
}: {
  on: boolean;
  /** Accessible name: what the switch turns on. */
  label: string;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className="bx-toggle"
      onClick={() => onChange(!on)}
    />
  );
}
