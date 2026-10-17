/**
 * What a new provider still has to do before members can find, join and pay
 * them (discoverability F9). The web counterpart of the coach app's
 * SetupChecklist (mobile utils/coachSetup.ts), built from real API state:
 *
 *   listing   their marketplace listing is published (findable)
 *   plans     at least one active plan members can buy (joinable)
 *   payments  their own payment keys are on, and Paystack's webhook has
 *             reached us (owner only: payment keys are the owner's)
 *   people    their first client (trainer, dietitian) or member (gym)
 */
import type { OrgPaymentConfig } from "@/lib/api/marketplace";

export type SetupKind = "trainer" | "dietitian" | "gym";
export type SetupStepKey = "listing" | "plans" | "payments" | "people";

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
export const SETUP_HREFS: Record<SetupKind, Record<SetupStepKey, string>> = {
  trainer: {
    listing: "/dashboard/trainer/profile",
    plans: "/dashboard/trainer/plans",
    payments: "/dashboard/trainer/settings#gateways",
    people: "/dashboard/trainer/clients",
  },
  dietitian: {
    listing: "/dashboard/dietitian/profile",
    plans: "/dashboard/dietitian/plans",
    payments: "/dashboard/dietitian/settings#gateways",
    people: "/dashboard/dietitian/clients",
  },
  gym: {
    listing: "/dashboard/profile-edit",
    plans: "/dashboard/gym-owner/plans",
    payments: "/dashboard/gym-owner/settings#gateways",
    people: "/dashboard/gym-owner/members",
  },
};

export interface SetupInput {
  /** The provider's listing, or null when they have none yet. */
  listing: { is_published: boolean } | null;
  /** Active plans members can buy. */
  activePlans: number;
  /**
   * The workspace's payment configs, or null to leave the step out (someone
   * who doesn't own the workspace: payment keys are the owner's).
   */
  payments: OrgPaymentConfig[] | null;
  /** Clients (trainer, dietitian) or members (gym). */
  people: number;
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
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

export function setupSteps(kind: SetupKind, input: SetupInput): SetupStep[] {
  const href = SETUP_HREFS[kind];
  const gym = kind === "gym";
  const { listing, activePlans, payments, people } = input;

  const steps: SetupStep[] = [
    {
      key: "listing",
      title: gym ? "Publish your listing" : "Publish your profile",
      detail: !listing
        ? gym
          ? "Members find your gym from its listing."
          : "Members find you from your profile."
        : listing.is_published
          ? gym
            ? "Live. Members can find your gym."
            : "Live. Members can find you."
          : "Saved but not published, so nobody can see it yet.",
      done: !!listing?.is_published,
      href: href.listing,
    },
    {
      key: "plans",
      title: gym ? "Create a membership plan" : "Create a plan",
      detail:
        activePlans > 0
          ? `${count(activePlans, "active plan")}.`
          : gym
            ? "Members need a plan to join and pay."
            : "Members need a plan to join and pay you.",
      done: activePlans > 0,
      href: href.plans,
    },
  ];

  if (payments) {
    const state = paymentsState(payments);
    steps.push({
      key: "payments",
      title: "Add your payment keys",
      detail:
        state === "none"
          ? "Payments settle straight to your account, and members can renew by card."
          : state === "no_webhook"
            ? "Keys saved. Add the webhook URL in Paystack so payments confirm."
            : "Connected.",
      done: state === "connected",
      href: href.payments,
    });
  }

  steps.push({
    key: "people",
    title: gym ? "Get your first member" : "Add your first client",
    detail:
      people > 0
        ? `${count(people, gym ? "member" : "client")}.`
        : gym
          ? "Import the members you already have."
          : "Invite someone you already work with.",
    done: people > 0,
    href: href.people,
  });

  return steps;
}
