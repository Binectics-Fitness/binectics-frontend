import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { SIDEBAR as TRAINER_SIDEBAR, gymTrainerNote, sidebarFor } from "@/components/ds/TrainerDashboardShell";
import { SIDEBAR as DIETITIAN_SIDEBAR } from "@/components/ds/DietitianDashboardShell";
import { SIDEBAR as GYM_SIDEBAR } from "@/components/ds/GymDashboardShell";
import { SIDEBAR as ADMIN_SIDEBAR } from "@/components/ds/AdminDashboardShell";
import { accountMenuItems } from "@/components/ds/accountMenuItems";
import { MEMBER_NAV_LINKS } from "@/components/ds/MemberDashboardShell";
import { gymClassesHref } from "@/app/dashboard/member/_components/GymClassesLink";
import { HEALTH_PRIVACY_HREF } from "@/app/dashboard/settings/privacy/HealthAppsCard";
import { CANCELLATION_POLICY_HREF } from "@/components/provider/CancellationPolicyCard";
import { HELP_COMMANDS, accountCommands, actionCommandsFor, defaultNavigationCommands } from "@/lib/constants/commands";
import { NOTIFICATION_SETTINGS_HREF } from "@/lib/constants/routes";
import { seatReviewFor } from "@/app/dashboard/billing/billingRole";
import { UserRole } from "@/lib/types";
import { SETUP_HREFS } from "@/lib/provider/setupSteps";
import { PLAN_GATE_HREF } from "@/components/ds/PlanGate";
import { GATEWAYS_HREF } from "@/app/dashboard/gym-owner/card-renewals/CardRenewalsClient";
import { PENDING_INVITES_HREF } from "@/app/dashboard/dietitian/DietitianTodayClient";
import { isAppRoute } from "./appRoutes";

type Section = { label: string; items: { name: string; href: string }[] };
const names = (sections: Section[]) => sections.flatMap((s) => s.items.map((i) => i.name));
const hrefs = (sections: Section[]) => sections.flatMap((s) => s.items.map((i) => i.href));

describe("every nav and command link goes to a real page", () => {
  const ROLES = Object.values(UserRole);
  const all: [string, string][] = [
    ...hrefs(TRAINER_SIDEBAR).map((h): [string, string] => ["trainer sidebar", h]),
    ...hrefs(DIETITIAN_SIDEBAR).map((h): [string, string] => ["dietitian sidebar", h]),
    ...hrefs(GYM_SIDEBAR).map((h): [string, string] => ["gym sidebar", h]),
    ...hrefs(ADMIN_SIDEBAR).map((h): [string, string] => ["admin sidebar", h]),
    ...ROLES.flatMap((role) => accountMenuItems({ role, is_admin: true }).map((i): [string, string] => [`${role} account menu`, i.href])),
    // Member surfaces (discoverability W3): the member nav, My gym's
    // Classes and the health apps card's policy link.
    ...MEMBER_NAV_LINKS.map((l): [string, string] => ["member nav", l.href]),
    ["my gym classes", gymClassesHref("6abe5a17882f018fcdb21c61")],
    ["health apps policy", HEALTH_PRIVACY_HREF],
    ...[null, ...ROLES].flatMap((role) => defaultNavigationCommands(role).map((c): [string, string] => [`${role} commands`, c.href])),
    ...ROLES.flatMap((role) =>
      [...actionCommandsFor(role), ...actionCommandsFor(role, { gymTrainer: true })].map((c): [string, string] => [`${role} actions`, c.href]),
    ),
    ...[...accountCommands(), ...HELP_COMMANDS].map((c): [string, string] => ["shared commands", c.href]),
    ...ROLES.map((role): [string, string] => [`${role} seat review`, seatReviewFor(role).href]),
    ["cancellation policy", CANCELLATION_POLICY_HREF],
    ["notification settings", NOTIFICATION_SETTINGS_HREF],
    // Provider first run (discoverability W2): the setup checklist's steps,
    // the plan gate's Billing link, the renewals banner and Today's tiles.
    ...Object.entries(SETUP_HREFS).flatMap(([kind, steps]) =>
      Object.values(steps).map((h): [string, string] => [`${kind} setup checklist`, h]),
    ),
    ["plan gate", PLAN_GATE_HREF],
    ["card renewals prerequisite", GATEWAYS_HREF],
    ["dietitian pending invitations tile", PENDING_INVITES_HREF],
    ["gym rating tile", "/dashboard/gym-owner/reviews"],
    ["dietitian availability empty state", "/dashboard/dietitian/settings"],
  ];

  it.each(all)("%s: %s", (_where, href) => {
    expect(isAppRoute(href)).toBe(true);
  });

  it("can tell a missing page from a real one", () => {
    expect(isAppRoute("/dashboard/member/settings")).toBe(false);
    expect(isAppRoute("/dashboard/gym-owner/profile")).toBe(false);
    expect(isAppRoute("/marketplace/abc123")).toBe(true);
  });
});

describe("trainer nav", () => {
  it("gives a trainer with their own practice Billing and Refunds", () => {
    const own = names(sidebarFor(TRAINER_SIDEBAR, false));
    expect(own).toEqual(expect.arrayContaining(["Billing", "Refunds", "Plans"]));
    expect(own).not.toContain("Packages");
  });

  it("does not give a gym's staff trainer what the gym owns, Billing and Refunds included", () => {
    const staff = names(sidebarFor(TRAINER_SIDEBAR, true));
    for (const hidden of ["Billing", "Refunds", "Plans", "Requests", "Forms", "My profile"]) {
      expect(staff).not.toContain(hidden);
    }
    expect(staff).toEqual(expect.arrayContaining(["Today", "Clients", "Earnings", "Settings"]));
  });

  it("says in one line why the staff trainer's nav is shorter", () => {
    expect(gymTrainerNote("Iron Temple")).toBe("Iron Temple manages your listing, plans, forms and billing.");
  });
});

describe("dietitian and gym nav", () => {
  it("gives a dietitian Billing and Refunds", () => {
    expect(names(DIETITIAN_SIDEBAR)).toEqual(expect.arrayContaining(["Billing", "Refunds"]));
  });

  it("puts meal feedback with the dietitian's plans and food (F23)", () => {
    const food = DIETITIAN_SIDEBAR.find((s) => s.label === "Plans & food");
    expect(food?.items.find((i) => i.name === "Meal feedback")?.href).toBe("/dashboard/dietitian/feedback");
  });

  it("puts Refunds with the gym's money", () => {
    const money = GYM_SIDEBAR.find((s) => s.label === "Money");
    expect(money?.items.map((i) => i.name)).toContain("Refunds");
    expect(names(GYM_SIDEBAR)).toContain("Billing");
  });
});

describe("admin nav", () => {
  it("links the refund queue next to Disputes", () => {
    const moderate = ADMIN_SIDEBAR.find((s) => s.label === "Moderate")?.items.map((i) => i.name) ?? [];
    expect(moderate).toContain("Refunds");
    expect(moderate.indexOf("Refunds") + 1).toBe(moderate.indexOf("Disputes"));
  });

  it("hides pages that are still placeholders", () => {
    for (const pending of ["Fraud", "Tickets", "Countries", "Team & roles", "Compliance"]) {
      expect(names(ADMIN_SIDEBAR)).not.toContain(pending);
    }
  });

  it.each(hrefs(ADMIN_SIDEBAR).filter((h) => h.startsWith("/admin/")))("%s is a built page, not a placeholder", (href) => {
    const page = readFileSync(resolve(__dirname, `../../app${href}/page.tsx`), "utf8");
    expect(page).not.toMatch(/FeaturePending/);
  });
});

describe("account menu links", () => {
  it("are the same real places for every role (no per-role /profile or /settings guesses)", () => {
    for (const role of Object.values(UserRole)) {
      const items = accountMenuItems({ role });
      expect(items.map((i) => i.label)).toEqual(["Dashboard", "Profile", "Settings"]);
      expect(items.find((i) => i.label === "Settings")?.href).toBe("/dashboard/settings");
    }
  });

  it("adds the admin panel only for a platform admin who isn't on the admin role", () => {
    expect(accountMenuItems({ role: UserRole.GYM_OWNER, is_admin: true }).map((i) => i.label)).toContain("Admin panel");
    expect(accountMenuItems({ role: UserRole.GYM_OWNER }).map((i) => i.label)).not.toContain("Admin panel");
    expect(accountMenuItems({ role: UserRole.ADMIN, is_admin: true }).map((i) => i.label)).not.toContain("Admin panel");
  });
});

describe("billing seat prompt", () => {
  it("sends each provider to their own people", () => {
    expect(seatReviewFor(UserRole.TRAINER).href).toBe("/dashboard/trainer/clients");
    expect(seatReviewFor(UserRole.DIETITIAN).href).toBe("/dashboard/dietitian/clients");
    expect(seatReviewFor(UserRole.GYM_OWNER).href).toBe("/dashboard/gym-owner/members");
  });

  it("only tells a gym that archiving frees a seat", () => {
    expect(seatReviewFor(UserRole.GYM_OWNER).advice).toMatch(/Archiving a member frees their seat/);
    expect(seatReviewFor(UserRole.TRAINER).advice).not.toMatch(/Archiv/);
  });
});
