import { describe, it, expect } from "vitest";
import type { ClientInvitation, ClientRequestItem } from "@/lib/api/progress";
import {
  daysUntilExpiry,
  expiryLabel,
  inviterName,
  isInvitationExpired,
  personName,
  requesterName,
} from "./invitations";

const NOW = new Date("2026-08-01T12:00:00.000Z");

describe("personName", () => {
  it("joins first and last name", () => {
    expect(personName({ _id: "1", first_name: "Ada", last_name: "Obi" })).toBe(
      "Ada Obi",
    );
  });

  it("copes with only one name part", () => {
    expect(personName({ _id: "1", first_name: "Ada" })).toBe("Ada");
    expect(personName({ _id: "1", last_name: "Obi" })).toBe("Obi");
  });

  it("falls back to the email when there is no name", () => {
    expect(personName({ _id: "1", email: "ada@example.com" })).toBe(
      "ada@example.com",
    );
  });

  it("never leaks a raw id for an unpopulated ref", () => {
    expect(personName("64bfb0c2e1a2b3c4d5e6f7a8")).toBe("Someone");
    expect(personName("64bfb0c2e1a2b3c4d5e6f7a8", "A provider")).toBe(
      "A provider",
    );
  });

  it("falls back when the ref is missing or all-whitespace", () => {
    expect(personName(null)).toBe("Someone");
    expect(personName(undefined)).toBe("Someone");
    expect(personName({ _id: "1", first_name: "  ", last_name: "  " })).toBe(
      "Someone",
    );
  });
});

describe("requesterName / inviterName", () => {
  it("reads the populated professional off a request", () => {
    const request = {
      _id: "r1",
      professional_id: { _id: "p1", first_name: "Ada", last_name: "Obi" },
    } as unknown as ClientRequestItem;
    expect(requesterName(request)).toBe("Ada Obi");
  });

  it("uses a provider-flavoured fallback when the ref is unpopulated", () => {
    const request = { _id: "r1", professional_id: "p1" } as unknown as ClientRequestItem;
    expect(requesterName(request)).toBe("A provider");
  });

  it("reads the populated inviter off an invitation", () => {
    const invitation = {
      _id: "i1",
      invited_by: { _id: "p1", email: "coach@example.com" },
    } as unknown as ClientInvitation;
    expect(inviterName(invitation)).toBe("coach@example.com");
  });
});

describe("isInvitationExpired", () => {
  it("is true once the expiry has passed", () => {
    expect(isInvitationExpired("2026-07-31T12:00:00.000Z", NOW)).toBe(true);
  });

  it("is true exactly at the boundary", () => {
    expect(isInvitationExpired("2026-08-01T12:00:00.000Z", NOW)).toBe(true);
  });

  it("is false while the window is open", () => {
    expect(isInvitationExpired("2026-08-05T12:00:00.000Z", NOW)).toBe(false);
  });

  it("treats an unusable date as not expired, the server decides", () => {
    expect(isInvitationExpired(undefined, NOW)).toBe(false);
    expect(isInvitationExpired("", NOW)).toBe(false);
    expect(isInvitationExpired("whenever", NOW)).toBe(false);
  });
});

describe("daysUntilExpiry", () => {
  it("counts whole days remaining", () => {
    expect(daysUntilExpiry("2026-08-04T12:00:00.000Z", NOW)).toBe(3);
    expect(daysUntilExpiry("2026-08-02T11:00:00.000Z", NOW)).toBe(0);
  });

  it("clamps a passed expiry to zero", () => {
    expect(daysUntilExpiry("2026-07-01T12:00:00.000Z", NOW)).toBe(0);
  });

  it("returns null when there is no usable date", () => {
    expect(daysUntilExpiry(undefined, NOW)).toBeNull();
    expect(daysUntilExpiry("nope", NOW)).toBeNull();
  });
});

describe("expiryLabel", () => {
  it("labels the common cases", () => {
    expect(expiryLabel("2026-07-01T12:00:00.000Z", NOW)).toBe("Expired");
    expect(expiryLabel("2026-08-02T11:00:00.000Z", NOW)).toBe("Expires today");
    expect(expiryLabel("2026-08-03T11:00:00.000Z", NOW)).toBe("Expires in 1 day");
    expect(expiryLabel("2026-08-05T12:00:00.000Z", NOW)).toBe("Expires in 4 days");
  });

  it("returns null when there is no usable date", () => {
    expect(expiryLabel(undefined, NOW)).toBeNull();
  });
});
