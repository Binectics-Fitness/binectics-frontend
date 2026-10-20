/**
 * What a new provider still has to do before members can find, book, join
 * and pay them (discoverability F9), built from real API state.
 *
 * Trainers and dietitians get the coach app's own four steps (mobile
 * utils/coachSetup.ts), so the two checklists, which share one Hide flag,
 * agree:
 *
 *   listing   their profile is published (findable)
 *   hours     weekly hours members can book (bookable)
 *   session   their own session, its length and price
 *   people    their first client
 *
 * A coach's own payment keys are optional (checkout falls back to the
 * platform's account), so they are not a step: a coach on the platform
 * account could never finish.
 *
 * A gym gets the steps a gym can't run without:
 *
 *   listing   its listing is published
 *   plans     at least one active membership plan
 *   payments  its own payment keys, and Paystack's webhook (owner only:
 *             card renewals charge on the gym's own account)
 *   people    its first member
 */
import type { OrgPaymentConfig } from "@/lib/api/marketplace";
import { formatMinor } from "@/lib/currencies/helpers";

export type SetupKind = "trainer" | "dietitian" | "gym";
export type CoachKind = Exclude<SetupKind, "gym">;
export type SetupStepKey = "listing" | "hours" | "session" | "plans" | "payments" | "people";

export interface SetupStep {
  key: SetupStepKey;
  title: string;
  /** What is missing, or what is already there. One short sentence. */
  detail: string;
  done: boolean;
  /** Where the step is done. */
  href: string;
}

/** Where each step is done, per dashboard. Every one is a real page (tests/unit/wayfinding-nav). */
export const SETUP_HREFS = {
  trainer: {
    listing: "/dashboard/trainer/profile",
    hours: "/dashboard/trainer/settings#hours",
    session: "/dashboard/trainer/settings#session",
    people: "/dashboard/trainer/clients",
  },
  dietitian: {
    listing: "/dashboard/dietitian/profile",
    hours: "/dashboard/dietitian/settings#hours",
    session: "/dashboard/dietitian/settings#session",
    people: "/dashboard/dietitian/clients",
  },
  gym: {
    listing: "/dashboard/profile-edit",
    plans: "/dashboard/gym-owner/plans",
    payments: "/dashboard/gym-owner/settings#gateways",
    people: "/dashboard/gym-owner/members",
  },
} as const;

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

function listingDetail(listing: { is_published: boolean } | null, gym: boolean): string {
  if (!listing) return gym ? "Members find your gym from its listing." : "Members find you from your profile.";
  if (!listing.is_published) return "Saved but not published, so nobody can see it yet.";
  return gym ? "Live. Members can find your gym." : "Live. Members can find you.";
}

// ─── Trainers and dietitians ────────────────────────────────────────────────

export interface CoachSetupInput {
  /** Their listing, or null when they have none yet. */
  listing: { is_published: boolean } | null;
  /** Their weekly availability rules. */
  rules: readonly { dayOfWeek: number; isActive: boolean }[];
  /** Their own session types (not the platform default). */
  ownTypes: readonly {
    name: string;
    isActive: boolean;
    defaultDurationMinutes: number;
    priceMinor?: number | null;
    currency?: string | null;
  }[];
  /** Clients, from the page. */
  people: number;
  /**
   * A gym's trainer: members find them through the gym's listing and the
   * API refuses them one, so there is no listing step (as on mobile).
   */
  staffTrainer?: boolean;
}

export function coachSetupSteps(kind: CoachKind, input: CoachSetupInput): SetupStep[] {
  const href = SETUP_HREFS[kind];
  const { listing, rules, ownTypes, people, staffTrainer } = input;
  const activeDays = new Set(rules.filter((r) => r.isActive).map((r) => r.dayOfWeek)).size;
  const session = ownTypes.find((t) => t.isActive);

  const steps: SetupStep[] = [
    {
      key: "listing",
      title: "Publish your profile",
      detail: listingDetail(listing, false),
      done: !!listing?.is_published,
      href: href.listing,
    },
    {
      key: "hours",
      title: "Set your hours",
      detail:
        activeDays === 0 ? "Members can only book times you say you work." : `${count(activeDays, "day")} a week.`,
      done: activeDays > 0,
      href: href.hours,
    },
    {
      key: "session",
      title: "Set your session",
      detail: session
        ? `${session.name}, ${session.defaultDurationMinutes} min, ${
            session.priceMinor && session.currency ? formatMinor(session.currency, session.priceMinor) : "free"
          }.`
        : "Length and price of a session.",
      done: !!session,
      href: href.session,
    },
    {
      key: "people",
      title: "Add your first client",
      detail: people > 0 ? `${count(people, "client")}.` : "Invite someone you already work with.",
      done: people > 0,
      href: href.people,
    },
  ];
  return staffTrainer ? steps.filter((s) => s.key !== "listing") : steps;
}

// ─── Gyms ───────────────────────────────────────────────────────────────────

export interface GymSetupInput {
  listing: { is_published: boolean } | null;
  /** Active membership plans members can buy. */
  activePlans: number;
  /**
   * The gym's payment configs, or null to leave the step out (anyone but
   * the owner: payment keys are the owner's).
   */
  payments: OrgPaymentConfig[] | null;
  /** Members. */
  people: number;
}

/** The payments step's state: no keys, keys but no webhook yet, or connected. */
export function paymentsState(configs: OrgPaymentConfig[]): "none" | "no_webhook" | "connected" {
  const active = configs.filter((c) => c.is_active);
  if (active.length === 0) return "none";
  // Paystack confirms payments by webhook. Null means none has arrived yet;
  // an older API leaves the field out, and that isn't held against anyone.
  const waiting = active.some((c) => c.gateway === "paystack" && c.webhook_last_received_at === null);
  return waiting ? "no_webhook" : "connected";
}

export function gymSetupSteps(input: GymSetupInput): SetupStep[] {
  const href = SETUP_HREFS.gym;
  const { listing, activePlans, payments, people } = input;

  const steps: SetupStep[] = [
    {
      key: "listing",
      title: "Publish your listing",
      detail: listingDetail(listing, true),
      done: !!listing?.is_published,
      href: href.listing,
    },
    {
      key: "plans",
      title: "Create a membership plan",
      detail: activePlans > 0 ? `${count(activePlans, "active plan")}.` : "Members need a plan to join and pay.",
      done: activePlans > 0,
      href: href.plans,
    },
  ];

  if (payments) {
    const state = paymentsState(payments);
    steps.push(
      state === "no_webhook"
        ? {
            key: "payments",
            title: "Connect Paystack's webhook",
            // Null until the first payment arrives, so it can't be "wrong" yet.
            detail: "No webhook from Paystack yet. If you've added the URL, this clears after the first payment.",
            done: false,
            href: href.payments,
          }
        : {
            key: "payments",
            title: "Add your payment keys",
            detail:
              state === "none"
                ? "Membership payments then settle straight to your Paystack account, and members can renew by card."
                : "Connected.",
            done: state === "connected",
            href: href.payments,
          },
    );
  }

  steps.push({
    key: "people",
    title: "Get your first member",
    detail: people > 0 ? `${count(people, "member")}.` : "Import the members you already have.",
    done: people > 0,
    href: href.people,
  });

  return steps;
}
