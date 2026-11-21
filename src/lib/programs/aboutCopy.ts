/**
 * What a client reads about a program: the coach's description and cautions
 * (owner decision D4, 20 Nov 2026; API in binectics-api #361). Board:
 * binectics-plans/design/create-program-ux-review/boards/web-cautions.html,
 * frames W1 (lock card), W2 (offer page) and W3 (started program). The same
 * words as the mobile block. Every on-screen string for it lives here.
 */
export const PROGRAM_ABOUT_COPY = {
  /** Eyebrow on the member home card under the program hero (W3). */
  heading: "About this program",
  /** The label inside the cautions block (W1, W2, W3). */
  cautionsTitle: "Cautions",
} as const;
