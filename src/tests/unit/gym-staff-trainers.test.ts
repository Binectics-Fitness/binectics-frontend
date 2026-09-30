import { describe, it, expect } from "vitest";
import { coachingGym, pickOrgForDashboard, teamRoleHint } from "@/lib/workspaces";
import { sidebarFor } from "@/components/ds/TrainerDashboardShell";
import { trainerOptions } from "@/app/dashboard/gym-owner/members/[memberId]/TrainerCard";
import { MemberStatus, type OrganizationMember } from "@/lib/api/teams";

// A gym's staff trainer (team role "consultant") coaches in the gym's
// workspace: they own no trainer workspace of their own.
const staffGym = { _id: "gym", owner_id: "boss", account_type: "gym_owner", is_active: true, my_role_code: "consultant" };

describe("coachingGym", () => {
  it("finds the gym a person coaches at", () => {
    expect(coachingGym([staffGym], "u1")?._id).toBe("gym");
  });

  it.each([
    ["a manager there", { ...staffGym, my_role_code: "manager" }],
    ["the gym's owner", { ...staffGym, owner_id: "u1" }],
    ["a closed gym", { ...staffGym, is_active: false }],
    ["a trainer's workspace", { ...staffGym, account_type: "personal_trainer" }],
  ])("is null for %s", (_label, org) => {
    expect(coachingGym([org], "u1")).toBeNull();
  });

  it("is null without a user", () => {
    expect(coachingGym([staffGym], null)).toBeNull();
  });
});

describe("the trainer dashboard's workspace for a gym trainer", () => {
  it("is the gym they coach at", () => {
    expect(pickOrgForDashboard([staffGym], "trainer", { userId: "u1", currentId: null })?._id).toBe("gym");
  });

  it("is still their own trainer workspace when they have one", () => {
    const own = { _id: "own", owner_id: "u1", account_type: "personal_trainer", is_active: true };
    expect(pickOrgForDashboard([staffGym, own], "trainer", { userId: "u1", currentId: "gym" })?._id).toBe("own");
  });

  it("is not a gym where they aren't a trainer", () => {
    expect(pickOrgForDashboard([{ ...staffGym, my_role_code: "manager" }], "trainer", { userId: "u1" })).toBeNull();
  });
});

describe("sidebarFor", () => {
  const sections = [
    { label: "Work", items: [{ name: "Today", href: "/t", icon: null }, { name: "Requests", href: "/r", icon: null }] },
    { label: "Practice", items: [{ name: "Packages", href: "/p", icon: null }, { name: "My profile", href: "/m", icon: null }, { name: "Forms", href: "/f", icon: null }, { name: "Earnings", href: "/e", icon: null }] },
  ];

  it("hides what belongs to the gym from a gym trainer", () => {
    expect(sidebarFor(sections, true).flatMap((s) => s.items.map((i) => i.name))).toEqual(["Today", "Earnings"]);
  });

  it("leaves a trainer's own practice alone", () => {
    expect(sidebarFor(sections, false)).toBe(sections);
  });
});

describe("teamRoleHint", () => {
  it("says what the trainer role gives", () => {
    expect(teamRoleHint("consultant")).toMatch(/trainer dashboard and the coach app/);
    expect(teamRoleHint("manager")).toBeNull();
    expect(teamRoleHint(undefined)).toBeNull();
  });
});

describe("trainerOptions", () => {
  const member = (id: string, first: string, code: string, status = MemberStatus.ACTIVE): OrganizationMember =>
    ({
      _id: `m-${id}`,
      organization_id: "gym",
      user_id: { _id: id, first_name: first, last_name: "", email: `${id}@x.test` },
      team_role_id: { _id: `r-${code}`, code, name: code, organization_id: null, permissions: [], is_default: true },
      status,
    }) as unknown as OrganizationMember;

  it("offers the gym's active trainers by name, after Not assigned", () => {
    const team = [member("t2", "Zara", "consultant"), member("t1", "Ade", "consultant"), member("m1", "Mo", "manager"), member("t3", "Old", "consultant", MemberStatus.INACTIVE)];
    expect(trainerOptions(team, null)).toEqual([
      { label: "Not assigned", value: "" },
      { label: "Ade", value: "t1" },
      { label: "Zara", value: "t2" },
    ]);
  });

  it("keeps whoever has the member now, even if not a trainer", () => {
    expect(trainerOptions([member("m1", "Mo", "manager")], "m1").map((o) => o.value)).toEqual(["", "m1"]);
  });
});
