import { describe, it, expect } from "vitest";
import {
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import {
  bookingStatusLabel,
  canCancel,
  canMarkNoShow,
  clientDisplayName,
  clientInitials,
  durationMins,
  hasStarted,
  isActionable,
  needsEarlyCompleteConfirm,
  ACTION_SUCCESS_MESSAGE,
} from "@/lib/consultations/bookingActions";

// These rules gate real API calls: the backend rejects a no-show before the
// session was due to start, and refuses to act on terminal bookings. The UI
// must not offer a control the API will reject.

const NOW = Date.parse("2026-08-01T12:00:00.000Z");

function booking(overrides: Partial<ConsultationBooking> = {}): ConsultationBooking {
  return {
    id: "bk_1",
    clientUserId: "64f0aa11bb22cc33dd44ee55",
    providerId: "prov_1",
    consultationTypeId: "type_1",
    startsAt: "2026-08-01T14:00:00.000Z",
    endsAt: "2026-08-01T14:45:00.000Z",
    providerTimezone: "Africa/Lagos",
    clientTimezone: "Africa/Lagos",
    status: ConsultationBookingStatus.CONFIRMED,
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("isActionable", () => {
  it("allows actions on open bookings only", () => {
    expect(isActionable(ConsultationBookingStatus.CONFIRMED)).toBe(true);
    expect(isActionable(ConsultationBookingStatus.PENDING)).toBe(true);
  });

  it("refuses terminal statuses", () => {
    expect(isActionable(ConsultationBookingStatus.COMPLETED)).toBe(false);
    expect(isActionable(ConsultationBookingStatus.CANCELLED)).toBe(false);
    expect(isActionable(ConsultationBookingStatus.NO_SHOW)).toBe(false);
  });
});

describe("hasStarted", () => {
  it("is false before the start time", () => {
    expect(hasStarted(booking(), NOW)).toBe(false);
  });

  it("is true once the start time has passed", () => {
    expect(hasStarted(booking({ startsAt: "2026-08-01T11:00:00.000Z" }), NOW)).toBe(true);
  });

  it("treats an unmeasured clock snapshot as 'not started'", () => {
    expect(hasStarted(booking({ startsAt: "2000-01-01T00:00:00.000Z" }), 0)).toBe(false);
  });
});

describe("canMarkNoShow", () => {
  it("stays closed until the session start time has passed", () => {
    expect(canMarkNoShow(booking(), NOW)).toBe(false);
  });

  it("opens once the session should have started", () => {
    expect(canMarkNoShow(booking({ startsAt: "2026-08-01T11:00:00.000Z" }), NOW)).toBe(true);
  });

  it("never applies to an already-terminal booking", () => {
    const past = { startsAt: "2026-08-01T11:00:00.000Z" };
    expect(canMarkNoShow(booking({ ...past, status: ConsultationBookingStatus.COMPLETED }), NOW)).toBe(false);
    expect(canMarkNoShow(booking({ ...past, status: ConsultationBookingStatus.NO_SHOW }), NOW)).toBe(false);
  });
});

describe("canCancel", () => {
  it("is offered before the session starts", () => {
    expect(canCancel(booking(), NOW)).toBe(true);
  });

  it("is withdrawn once the session has started", () => {
    expect(canCancel(booking({ startsAt: "2026-08-01T11:00:00.000Z" }), NOW)).toBe(false);
  });

  it("never applies to a cancelled booking", () => {
    expect(canCancel(booking({ status: ConsultationBookingStatus.CANCELLED }), NOW)).toBe(false);
  });
});

describe("needsEarlyCompleteConfirm", () => {
  it("asks before completing a session that hasn't started", () => {
    expect(needsEarlyCompleteConfirm(booking(), NOW)).toBe(true);
  });

  it("completes silently once the session has started", () => {
    expect(needsEarlyCompleteConfirm(booking({ startsAt: "2026-08-01T11:00:00.000Z" }), NOW)).toBe(false);
  });
});

describe("ACTION_SUCCESS_MESSAGE", () => {
  it("has a message for every action the panel can run", () => {
    expect(ACTION_SUCCESS_MESSAGE.complete).toMatch(/completed/i);
    expect(ACTION_SUCCESS_MESSAGE["no-show"]).toMatch(/no-show/i);
    expect(ACTION_SUCCESS_MESSAGE.cancel).toMatch(/cancelled/i);
  });
});

describe("bookingStatusLabel", () => {
  it("renders NO_SHOW as human copy, not the raw enum", () => {
    expect(bookingStatusLabel(ConsultationBookingStatus.NO_SHOW)).toBe("No-show");
    expect(bookingStatusLabel(ConsultationBookingStatus.CONFIRMED)).toBe("Confirmed");
  });
});

describe("durationMins", () => {
  it("measures the booked window in whole minutes", () => {
    expect(durationMins(booking())).toBe(45);
  });

  it("floors a reversed range at zero", () => {
    expect(
      durationMins(booking({ startsAt: "2026-08-01T14:00:00.000Z", endsAt: "2026-08-01T13:00:00.000Z" })),
    ).toBe(0);
  });

  // Math.max(0, NaN) is NaN, not 0, so the floor alone does not cover this.
  // Untested, it rendered "NaN min" on screen and wrote NaN into the CSV.
  it("returns zero — not NaN — for an unparseable date", () => {
    expect(durationMins(booking({ endsAt: "not-a-date" }))).toBe(0);
    expect(durationMins(booking({ startsAt: "" }))).toBe(0);
    expect(
      durationMins(booking({ startsAt: "nope", endsAt: "also-nope" })),
    ).toBe(0);
  });
});

describe("clientDisplayName", () => {
  it("prefers the client's real name", () => {
    expect(clientDisplayName(booking({ clientFirstName: "Ada", clientLastName: "Obi" }))).toBe("Ada Obi");
  });

  it("uses whichever name part is present", () => {
    expect(clientDisplayName(booking({ clientFirstName: "Ada" }))).toBe("Ada");
  });

  it("falls back to a stable short id rather than inventing a name", () => {
    expect(clientDisplayName(booking())).toBe("Client 44EE55");
  });
});

describe("clientInitials", () => {
  it("takes first + last initial", () => {
    expect(clientInitials(booking({ clientFirstName: "Ada", clientLastName: "Obi" }))).toBe("AO");
  });

  it("takes two letters from a single name", () => {
    expect(clientInitials(booking({ clientFirstName: "Ada" }))).toBe("AD");
  });

  it("echoes the id tail when the payload carries no name", () => {
    expect(clientInitials(booking())).toBe("55");
  });
});
