import { describe, it, expect } from "vitest";
import { MemberStatus, type OrganizationMember } from "@/lib/api/teams";
import {
  filterMembers,
  matchesQuery,
  matchesStatus,
  statusCounts,
} from "@/app/dashboard/gym-owner/staff/staffFilters";

// Pure filtering rules behind the staff roster's search box and status
// chips. The design-system revamp dropped both controls; they were
// restored with this coverage so the matching rules can't silently rot
// again.

function member(
  overrides: Partial<{
    id: string;
    first: string;
    last: string;
    email: string;
    role: string;
    status: MemberStatus;
  }> = {},
): OrganizationMember {
  const {
    id = "m1",
    first = "John",
    last = "Doe",
    email = "john@example.com",
    role = "Trainer",
    status = MemberStatus.ACTIVE,
  } = overrides;
  return {
    _id: id,
    status,
    user_id: { _id: `u-${id}`, first_name: first, last_name: last, email },
    team_role_id: { _id: "role-1", name: role },
    created_at: "2026-01-01T00:00:00.000Z",
    joined_at: "2026-01-01T00:00:00.000Z",
  } as unknown as OrganizationMember;
}

describe("matchesQuery", () => {
  const m = member({ first: "Jane", last: "Smith", email: "jane@gym.co", role: "Front desk" });

  it("matches everything when the query is blank or whitespace", () => {
    expect(matchesQuery(m, "")).toBe(true);
    expect(matchesQuery(m, "   ")).toBe(true);
  });

  it("matches on first name, last name, and full name", () => {
    expect(matchesQuery(m, "jane")).toBe(true);
    expect(matchesQuery(m, "smith")).toBe(true);
    expect(matchesQuery(m, "Jane Smith")).toBe(true);
  });

  it("matches on email and on role", () => {
    expect(matchesQuery(m, "jane@gym")).toBe(true);
    expect(matchesQuery(m, "front desk")).toBe(true);
  });

  it("is case-insensitive and ignores surrounding whitespace", () => {
    expect(matchesQuery(m, "  SMITH  ")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesQuery(m, "zzz")).toBe(false);
  });

  it("does not throw on an unpopulated user reference", () => {
    const unpopulated = { _id: "m2", status: MemberStatus.ACTIVE, user_id: "just-an-id" } as unknown as OrganizationMember;
    expect(matchesQuery(unpopulated, "member")).toBe(true); // falls back to "Member"
    expect(matchesQuery(unpopulated, "john")).toBe(false);
  });
});

describe("matchesStatus", () => {
  it("'All' admits every status", () => {
    for (const status of [MemberStatus.ACTIVE, MemberStatus.PENDING, MemberStatus.INACTIVE]) {
      expect(matchesStatus(member({ status }), "All")).toBe(true);
    }
  });

  it("each named filter admits only its own status", () => {
    expect(matchesStatus(member({ status: MemberStatus.ACTIVE }), "Active")).toBe(true);
    expect(matchesStatus(member({ status: MemberStatus.ACTIVE }), "Inactive")).toBe(false);
    expect(matchesStatus(member({ status: MemberStatus.PENDING }), "Pending")).toBe(true);
    expect(matchesStatus(member({ status: MemberStatus.INACTIVE }), "Inactive")).toBe(true);
  });
});

describe("filterMembers", () => {
  const roster = [
    member({ id: "1", first: "John", last: "Doe", status: MemberStatus.ACTIVE }),
    member({ id: "2", first: "Jane", last: "Smith", email: "jane@x.co", status: MemberStatus.INACTIVE }),
    member({ id: "3", first: "Jim", last: "Beam", email: "jim@x.co", status: MemberStatus.PENDING }),
  ];

  it("returns the whole roster with no query and the All filter", () => {
    expect(filterMembers(roster, "", "All")).toHaveLength(3);
  });

  it("applies search and status together (AND, not OR)", () => {
    // "j" matches all three names, so only the status narrows it.
    expect(filterMembers(roster, "j", "Active").map((m) => m._id)).toEqual(["1"]);
    // Jane is INACTIVE, so an Active filter must exclude her even on an
    // exact name match.
    expect(filterMembers(roster, "Jane", "Active")).toHaveLength(0);
  });

  it("preserves roster order", () => {
    expect(filterMembers(roster, "", "All").map((m) => m._id)).toEqual(["1", "2", "3"]);
  });
});

describe("statusCounts", () => {
  it("counts each bucket over the unfiltered roster", () => {
    const roster = [
      member({ id: "1", status: MemberStatus.ACTIVE }),
      member({ id: "2", status: MemberStatus.ACTIVE }),
      member({ id: "3", status: MemberStatus.INACTIVE }),
      member({ id: "4", status: MemberStatus.PENDING }),
    ];
    expect(statusCounts(roster)).toEqual({ All: 4, Active: 2, Pending: 1, Inactive: 1 });
  });

  it("reports zeroes for an empty roster", () => {
    expect(statusCounts([])).toEqual({ All: 0, Active: 0, Pending: 0, Inactive: 0 });
  });
});
