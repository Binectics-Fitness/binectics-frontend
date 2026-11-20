/**
 * Every string the gym PAR-Q health form adds to the web (board:
 * binectics-plans/design/parq, build.py COPY). The questions and answers come
 * from the API's PAR-Q template.
 */
export const HEALTH_FORM_COPY = {
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
} as const;
