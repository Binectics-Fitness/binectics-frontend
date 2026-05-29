export type RoleId = "trainer" | "gym" | "dietitian";

export interface StepDef {
  label: string;
  title: string;
}

export interface RoleDef {
  id: RoleId;
  label: string;
  badge: string;
  color: string;
  steps: StepDef[];
}

export const ROLES: RoleDef[] = [
  {
    id: "trainer",
    label: "Trainer",
    badge: "Active",
    color: "var(--trainer)",
    steps: [
      { label: "Step 01", title: "Tell us about yourself" },
      { label: "Step 02", title: "Your specializations" },
      { label: "Step 03", title: "Upload certifications" },
      { label: "Step 04", title: "Set your pricing" },
      { label: "Step 05", title: "Connect your payout" },
      { label: "Step 06", title: "Preview & publish" },
    ],
  },
  {
    id: "gym",
    label: "Gym / studio",
    badge: "Business",
    color: "var(--gym)",
    steps: [
      { label: "Step 01", title: "Business details" },
      { label: "Step 02", title: "Add your first location" },
      { label: "Step 03", title: "Membership plans" },
      { label: "Step 04", title: "Verification documents" },
      { label: "Step 05", title: "Connect your payments" },
      { label: "Step 06", title: "Pick your kiosk" },
      { label: "Step 07", title: "Invite your staff" },
      { label: "Step 08", title: "Submit for review" },
    ],
  },
  {
    id: "dietitian",
    label: "Dietitian",
    badge: "Licensed",
    color: "var(--dietitian)",
    steps: [
      { label: "Step 01", title: "Your practice basics" },
      { label: "Step 02", title: "Licensure" },
      { label: "Step 03", title: "Your specializations" },
      { label: "Step 04", title: "Seed your library" },
      { label: "Step 05", title: "Connect your payout" },
      { label: "Step 06", title: "Preview & publish" },
    ],
  },
];

export const GENERIC_STEPS: StepDef[] = [
  { label: "Step 01", title: "Pick your role" },
  { label: "Step 02", title: "Account basics" },
  { label: "Step 03", title: "Your practice" },
  { label: "Step 04", title: "Verification & payouts" },
  { label: "Step 05", title: "Preview & go live" },
];

export const ROLE_CARDS = [
  {
    id: "trainer" as RoleId,
    title: "Personal trainer",
    desc: "List your services, manage clients, take bookings, and get paid — all in one place.",
    meta: "Individual · provider",
    color: "var(--trainer)",
  },
  {
    id: "gym" as RoleId,
    title: "Gym / studio",
    desc: "Manage locations, memberships, staff, check-ins, and revenue from a single dashboard.",
    meta: "Business · multi-location",
    color: "var(--gym)",
  },
  {
    id: "dietitian" as RoleId,
    title: "Dietitian",
    desc: "Build meal plans, consult clients, track adherence, and grow your practice online.",
    meta: "Licensed · provider",
    color: "var(--dietitian)",
  },
];
