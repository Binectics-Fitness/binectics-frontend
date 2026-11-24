/**
 * Every string the gym PAR-Q health form adds to the web (board:
 * binectics-plans/design/parq, build.py COPY). The questions and answers come
 * from the API's PAR-Q template.
 */
export const HEALTH_FORM_COPY = {
  // member (same words as mobile #273 healthFormCopy.ts)
  taskTitle: "Health form",
  taskMeta: (gym: string, n: number) => `From ${gym} · ${n} questions`,
  formTitle: "Health form",
  formIntro: (gym: string) => `${gym} asks every member before they train.`,
  formPrivacy: (gym: string) => `Only ${gym}'s managers see your answers.`,
  formCount: (n: number) => `${n} questions`,
  answered: (done: number, n: number) => `${done} of ${n} answered`,
  needsAttention: (n: number) => (n === 1 ? "1 question needs attention" : `${n} questions need attention`),
  required: "Required",
  chooseOption: "Choose one of the options",
  send: "Send",
  sending: "Sending…",
  sendFailed: "Could not send. Please try again.",
  doneTitle: (gym: string) => `Sent to ${gym}`,
  doneBody: "Thanks. Nothing else to do.",
  doneButton: "Done",
  yourGym: "Your gym",
  loadFailed: "Couldn't open this form",
  tryAgain: "Try again",
  // staff
  cardTitle: "Health form",
  notDone: "Health form not done",
  notDonePill: "Not done",
  donePill: "Done",
  sentOn: (date: string) => `Sent ${date}`,
  doneOn: (date: string) => `Filled in ${date}`,
  flag: "Follow up: a health answer needs a doctor's clearance",
  markFollowedUp: "Mark followed up",
  followedUp: (name: string | null, date: string) => (name ? `Followed up by ${name}, ${date}` : `Followed up, ${date}`),
  showAnswers: "Show answers",
  hideAnswers: "Hide answers",
  yes: "Yes",
  no: "No",
  noDetails: "No details given",
  answersFailed: "We couldn't load the answers. Try again.",
  saveFailed: "That didn't save. Try again.",
  switchHelp: "Members get the health form when they join. You'll see answers that need a follow-up.",
  /** One-time, above the switch while it is off (board parq W5). */
  switchNotice: "New: health form. Turn this on to send the PAR-Q form to your members.",
  dismiss: "Dismiss",
} as const;
