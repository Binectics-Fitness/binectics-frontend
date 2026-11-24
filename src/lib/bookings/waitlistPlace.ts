/**
 * "You're 2nd in line." for a waitlist place (mobile #182
 * `waitlistPlaceLabel`), or "" when the API did not say (a build before it
 * sent `waitlist_position`). The place is the queue as it stands: it moves
 * up as people ahead leave or are moved in.
 */
export function waitlistPlaceLabel(position: number | undefined | null): string {
  if (typeof position !== "number" || !Number.isInteger(position) || position < 1) return "";
  if (position === 1) return "You're first in line.";
  const mod100 = position % 100;
  const mod10 = position % 10;
  const suffix =
    mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th";
  return `You're ${position}${suffix} in line.`;
}
