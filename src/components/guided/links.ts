import { speech } from "@/lib/guided/speech";
import { sounds } from "@/lib/guided/sounds";

export const STARTER_PROGRAM_HREF = "/dashboard/member/starter";
export const sessionHref = (id: string) => `${STARTER_PROGRAM_HREF}/session/${id}`;
export const guidedHref = (id: string) => `${sessionHref(id)}/guided`;

/**
 * Unlock audio and speech. Browsers only allow both after a user gesture, so
 * this runs inside the Start click on the session page (and again on Resume
 * and the voice/sound switches, for a run reopened after a reload).
 */
export function unlockGuidedAudio(): void {
  sounds.warmUp();
  speech.warmUp();
}
