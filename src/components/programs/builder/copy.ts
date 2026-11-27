/**
 * Every on-screen string of the program builder page (owner-approved Create
 * Program redesign, 20 Nov 2026: binectics-plans/design/create-program-ux-review,
 * walkthrough.html "After (prototype)"). Tests assert the page renders these,
 * so wording changes happen here and nowhere else.
 */

export const BUILDER_COPY = {
  // ── New program dialog ──
  create: {
    title: "New program",
    nameLabel: "Name",
    namePlaceholder: "e.g. Strength base",
    nameError: "Name the program to create it.",
    lengthLabel: "Length",
    weeks: (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`,
    lessWeeks: "Less: length",
    moreWeeks: "More: length",
    startFrom: "Start from",
    blank: "Blank",
    copyOf: (name: string) => `Copy of ${name}`,
    cancel: "Cancel",
    submit: "Create",
    submitting: "Creating…",
    failed: "We couldn't create the program. Try again.",
  },

  // ── Page header ──
  header: {
    programs: "Programs",
    nameLabel: "Program name",
    saving: "Saving…",
    draftSaved: "Draft · saved",
    saved: "Saved",
    notSaved: "Not saved",
    retry: "Try again",
    settings: "Settings",
    startClient: "Start a client",
    /** D1: only sold or listed programs show a publish step. */
    publishChanges: "Publish changes",
    publishing: "Publishing…",
    published: "Changes published.",
  },
  loadFailed: "We couldn't open this program.",
  notFound: "That program no longer exists.",
  backToPrograms: "Back to programs",

  /** Why "Start a client" can't run yet, said under the button. */
  startBlocked: {
    noName: "Name the program to start a client",
    noTasks: "Add a task to start a client",
    fix: (n: number) => `Fix ${n} task${n > 1 ? "s" : ""} to start a client`,
    /** D1: a sold or listed program publishes on purpose before anyone new starts. */
    publishFirst: "Publish changes to start a client",
  },

  /** Someone is on the program (dietitian edit case). */
  banner: (names: string[]) =>
    `${names.join(", ")} ${names.length > 1 ? "are" : "is"} on the saved version. Your edits reach clients you start from now on.`,

  // ── Plan ──
  plan: {
    label: "Plan",
    addTask: "+ Add task",
    empty: "Add the first thing your client will do.",
    phaseWeeks: (from: number, to: number) => (from === to ? `week ${from}` : `weeks ${from}–${to}`),
    untitled: (typeLabel: string) => `Untitled ${typeLabel.toLowerCase()}`,
    exercises: (n: number) => `${n} exercise${n > 1 ? "s" : ""}`,
    times: (n: number) => `${n}×`,
  },

  /** Summary line above the plan: "4 weeks · 12 workouts · 28 habit days". */
  summary: {
    workout: (n: number) => `${n} ${n === 1 ? "workout" : "workouts"}`,
    habit: (n: number) => `${n} ${n === 1 ? "habit day" : "habit days"}`,
    checkin: (n: number) => `${n} ${n === 1 ? "check-in" : "check-ins"}`,
    measure: (n: number) => `${n} ${n === 1 ? "measurement" : "measurements"}`,
    meal: (n: number) => `${n} meal plan days`,
    note: (n: number) => `${n} ${n === 1 ? "note" : "notes"}`,
  },

  // ── Cadence text on a task row ──
  cadence: {
    onceAWeek: "Once a week",
    timesAWeek: (n: number) => `${n} times a week`,
    weekly: "Weekly",
    daily: "Daily",
    once: "Once",
    custom: "Custom",
    onceInWeek: (w: number) => `Once · week ${w}`,
    inWeeks: (c: string, from: number, to: number) => `${c} · ${from === to ? `week ${from}` : `weeks ${from}–${to}`}`,
    legacy: (c: string, day: number) => `${c} · starts day ${day} (set before)`,
  },

  // ── Client view (right panel, nothing selected) ──
  clientView: {
    eyebrow: "What your client sees",
    week: (n: number) => `Week ${n}`,
    of: (n: number) => `of ${n}`,
    lessWeek: "Less: preview week",
    moreWeek: "More: preview week",
    day: (n: number) => `Day ${n}`,
    rest: "Rest",
    footer: (late: string) => `Each day lands on your client's Today. Tasks can still be done late for ${late} (Settings).`,
    lateSameDay: "the same day only",
    lateDays: (n: number) => (n === 1 ? "1 day" : `${n} days`),
  },

  // ── Task inspector ──
  inspector: {
    close: "Close",
    title: "Title",
    titleOptional: "Title (optional)",
    titleError: "Give this task a title.",
    habitPlaceholder: "e.g. Walk 8,000 steps",
    notePlaceholder: "e.g. How to warm up",
    howOften: "How often",
    timesPerWeek: (n: number) => `${n}×`,
    weeks: "Weeks",
    inWeek: "In week",
    ofPhase: (name: string) => ` of ${name}`,
    from: "From",
    to: "To",
    weekN: (n: number) => `week ${n}`,
    lessFrom: "Less: start week",
    moreFrom: "More: start week",
    lessTo: "Less: end week",
    moreTo: "More: end week",
    legacyDays: (start: number, days: number | null) =>
      days ? `Starts day ${start}, lasts ${days} days (set before).` : `Starts day ${start} (set before).`,
    changeToWeeks: "Change to weeks",
    note: "Note for your client",
    notePlaceholderDetail: "How to do it, or why it matters",
    remove: "Remove task",
    removed: "Task removed",
    undo: "Undo",
  },

  cadenceOptions: {
    once: "Once",
    daily: "Daily",
    weekly: "Weekly",
    n_per_week: "Times a week",
  },

  // ── Workout ──
  workout: {
    exercises: "Exercises",
    addExercises: "+ Add exercises",
    addCustom: "+ Custom exercise",
    customName: (i: number) => `Exercise ${i} name`,
    sets: (name: string) => `${name} sets`,
    reps: (name: string) => `${name} reps`,
    seconds: (name: string) => `${name} seconds`,
    remove: (name: string) => `Remove ${name}`,
    error: "Add at least one exercise.",
    defaults: "New exercises start at 3 × 10, and holds at 3 × 30 s. Change any number in place.",
    linked: "Linked to a workout plan. Kept as it is.",
    full: (n: number) => `A workout holds at most ${n} exercises.`,
  },

  // ── Check-in form ──
  checkin: {
    label: "Form",
    newForm: "+ New form",
    error: "Pick the form your client fills in.",
    unavailable: "Linked form (unpublished or removed)",
    none: "No published forms yet.",
  },

  // ── Meal plan ──
  meal: {
    label: "Meal plan",
    newPlan: "+ New meal plan",
    error: "Pick the meal plan your client follows.",
    unavailable: "Linked plan (unavailable)",
    none: "No meal plans yet.",
  },

  /** P3-2: create the missing content in a sheet without leaving. */
  sheet: {
    formTitle: "New form",
    mealTitle: "New meal plan",
    close: "Close",
    formHint: "Build and publish the form, then close this sheet. It is picked for this task.",
    mealHint: "Create the meal plan, then close this sheet. It is picked for this task.",
  },

  // ── Measurement ──
  measure: {
    label: "What to record",
    target: "Target (optional)",
    byTheEnd: (unit: string) => `${unit ? unit + " " : ""}by the end`,
    targetHelp: "A target shows as a goal on your client's progress.",
    other: (key: string) => key,
  },

  // ── Habit: ticks itself ──
  ticks: {
    label: "Ticks itself",
    no: "No",
    water: "Water log",
    fast: "Fasting log",
    health: "Health app",
    waterSuffix: "glasses a day",
    fastSuffix: "hours of fasting",
    healthHelp:
      "Ticks itself once your client connects Health Connect (Samsung Health, Google Fit, a watch) and turns it on for program tasks. Until then they tick it. You see only whether they reached it and the number that day.",
    ownLogHelp: "You see only whether they reached it and the number that day.",
    waterError: "Set the glasses, 1 to 30",
    fastError: "Set the hours, 1 to 24",
    healthError: (unit: string, lo: number, hi: number) =>
      `Set the ${unit}, ${lo.toLocaleString("en-US")} to ${hi.toLocaleString("en-US")}`,
    keptRule: "Ticks from a health app. Kept when you save.",
  },

  /** Short reasons on a task row and the matching inline messages. */
  issue: {
    title: "Needs a title",
    form: "Pick a form",
    meal: "Pick a meal plan",
    workout: "Add an exercise",
  },

  // ── Settings drawer ──
  settings: {
    title: "Settings",
    done: "Done",
    phases: "Phases",
    oneBlock: "One block",
    split: "Split into phases",
    phaseName: (i: number) => `Phase ${i} name`,
    phaseLength: (name: string) => `${name} length`,
    addPhase: "+ Add a phase",
    removePhase: (name: string) => `Remove ${name}`,
    late: "Late tasks can still be done for",
    lateOptions: [
      [0, "Same day"],
      [1, "1 day"],
      [2, "2 days"],
      [3, "3 days"],
      [7, "A week"],
    ] as ReadonlyArray<readonly [number, string]>,
    description: "Description (shown on your listing)",
    cautions: "Who should not follow it",
    /** D3: category stays, under Settings. */
    category: "Category",
    categoryPlaceholder: "e.g. Strength",
    price: "Price",
    free: "Free",
    change: "Change",
    duplicate: "Duplicate",
    duplicated: "Copy made. You're editing the copy now.",
    archive: "Archive",
    archiveTitle: (name: string) => `Archive "${name}"?`,
    archiveBody: "It moves to Archived, where you can restore it later. Clients already on it keep their programs.",
    archiveConfirm: "Archive program",
  },

  // ── Start a client ──
  start: {
    title: (name: string) => `Start a client on ${name}`,
    client: "Client",
    starts: "Starts",
    today: "Today",
    tomorrow: "Tomorrow",
    nextMonday: "Next Monday",
    pickDate: "Pick a date",
    dateLabel: "Start date",
    summary: (weeks: number, parts: string[]) => `${weeks} weeks: ${parts.join(", ")}.`,
    button: (first: string) => `Start ${first}`,
    buttonIdle: "Start",
    starting: "Starting…",
    pickClient: "Pick a client to start",
    cancel: "Cancel",
    noClients: "No active clients yet.",
    loadClientsFailed: "We couldn't load your clients.",
    failed: "We couldn't start the client. Try again.",
  },
  startParts: {
    workout: (n: number) => `${n} ${n === 1 ? "workout" : "workouts"}`,
    habit: (n: number) => `${n} ${n === 1 ? "habit" : "habits"}`,
    checkin: (n: number) => `${n} ${n === 1 ? "check-in form" : "check-in forms"}`,
    measure: (n: number) => `${n} ${n === 1 ? "measurement" : "measurements"}`,
    meal: (n: number) => `${n} ${n === 1 ? "meal plan" : "meal plans"}`,
    note: (n: number) => `${n} ${n === 1 ? "note" : "notes"}`,
  },

  // ── Started ──
  done: {
    title: (first: string, when: string) => `${first} starts ${when}`,
    today: "today",
    body: (name: string) => `${name} is on their Today from day 1.`,
    seePlan: (first: string) => `See ${first}'s plan`,
    back: "Back to the program",
  },
} as const;

/** The six task types the coach picks from ("+ Add task"). */
export const TASK_TYPE_COPY = {
  workout: { label: "Workout", meta: "Exercises, 3 times a week" },
  habit: { label: "Habit", meta: "Something to do every day" },
  checkin: { label: "Check-in form", meta: "One of your forms, weekly" },
  measure: { label: "Measurement", meta: "Weight, waist or steps, weekly" },
  meal: { label: "Meal plan", meta: "One of your meal plans, daily" },
  note: { label: "Note", meta: "Advice to read once" },
} as const;
