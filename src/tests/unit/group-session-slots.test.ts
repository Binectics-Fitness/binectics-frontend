import { describe, expect, it } from "vitest";
import { ConsultationBookingStatus as S, slotSeatsLabel, type ConsultationBooking } from "@/lib/api/consultations";
import { groupBySlot, groupTitle, slotKey } from "@/app/dashboard/trainer/_components/coachSchedule";

describe("slotSeatsLabel", () => {
  it("says how many places a group slot has left", () => {
    expect(slotSeatsLabel({ capacity: 4, seatsLeft: 2, isAvailable: true })).toBe("2 of 4 left");
    expect(slotSeatsLabel({ capacity: 4, seatsLeft: 4, isAvailable: true })).toBe("4 of 4 left");
  });
  it("says nothing for a 1:1, a full slot, or an older API", () => {
    expect(slotSeatsLabel({ capacity: 1, seatsLeft: 1, isAvailable: true })).toBeNull();
    expect(slotSeatsLabel({ capacity: 4, seatsLeft: 0, isAvailable: false })).toBeNull();
    expect(slotSeatsLabel({ isAvailable: true })).toBeNull();
  });
});

const at = "2026-12-05T09:00:00.000Z";
const end = "2026-12-05T10:00:00.000Z";
const booking = (id: string, over: Partial<ConsultationBooking> = {}): ConsultationBooking =>
  ({
    id,
    clientUserId: `c-${id}`,
    clientFirstName: id.toUpperCase(),
    providerId: "p",
    consultationTypeId: "group",
    consultationTypeName: "Small-group strength",
    startsAt: at,
    endsAt: end,
    providerTimezone: "Africa/Lagos",
    clientTimezone: "Africa/Lagos",
    status: S.CONFIRMED,
    ...over,
  }) as ConsultationBooking;

describe("groupBySlot", () => {
  it("puts a group slot's attendees on one row", () => {
    const rows = [booking("a"), booking("b"), booking("c"), booking("d", { startsAt: end, endsAt: "2026-12-05T11:00:00.000Z" })];
    const entries = groupBySlot(rows);
    expect(entries).toHaveLength(2);
    expect(entries[0].attendees.map((b) => b.id)).toEqual(["a", "b", "c"]);
    expect(groupTitle(entries[0])).toBe("Small-group strength · 3 booked");
    expect(groupTitle(entries[1])).toBeNull();
  });

  it("keeps cancelled bookings on their own rows, and a different type apart", () => {
    const rows = [booking("a"), booking("b", { status: S.CANCELLED }), booking("c", { consultationTypeId: "other" })];
    const entries = groupBySlot(rows);
    expect(entries.map((e) => e.attendees.length)).toEqual([1, 1, 1]);
  });

  it("keys a slot by start, end and type", () => {
    expect(slotKey(booking("a"))).toBe(slotKey(booking("b")));
    expect(slotKey(booking("a"))).not.toBe(slotKey(booking("c", { consultationTypeId: "x" })));
  });
});
