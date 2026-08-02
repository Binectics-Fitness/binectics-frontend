import { describe, it, expect } from "vitest";
import {
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import {
  buildSessionsCsv,
  SESSIONS_CSV_HEADERS,
} from "@/app/dashboard/trainer/sessions/sessions-csv";

// The Export CSV button on the trainer sessions log downloads this. It must
// export exactly the rows on screen, and a client note containing a comma or
// a quote must not corrupt the file.

const fmtDateTime = (iso: string) => iso.replace("T", " ").slice(0, 16);

function booking(overrides: Partial<ConsultationBooking> = {}): ConsultationBooking {
  return {
    id: "bk_1",
    clientUserId: "64f0aa11bb22cc33dd44ee55",
    clientFirstName: "Ada",
    clientLastName: "Obi",
    providerId: "prov_1",
    consultationTypeId: "type_1",
    startsAt: "2026-08-01T14:00:00.000Z",
    endsAt: "2026-08-01T14:45:00.000Z",
    providerTimezone: "Africa/Lagos",
    clientTimezone: "Africa/Lagos",
    status: ConsultationBookingStatus.COMPLETED,
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    ...overrides,
  };
}

const opts = { typesById: { type_1: "Strength session" }, fmtDateTime };

describe("buildSessionsCsv", () => {
  it("emits the header row even for an empty export", () => {
    expect(buildSessionsCsv([], opts)).toBe(SESSIONS_CSV_HEADERS.join(","));
  });

  it("emits one line per session in header order", () => {
    const lines = buildSessionsCsv([booking({ notes: "Deadlift focus" })], opts).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("2026-08-01 14:00,Ada Obi,Strength session,45,Completed,Deadlift focus");
  });

  it("uses the caller's date formatter so the file matches the screen", () => {
    const csv = buildSessionsCsv([booking()], { ...opts, fmtDateTime: () => "1 Aug 2026, 15:00" });
    expect(csv).toContain('"1 Aug 2026, 15:00"');
  });

  it("falls back to 'Consultation' for an unknown type id", () => {
    const csv = buildSessionsCsv([booking({ consultationTypeId: "gone" })], opts);
    expect(csv.split("\n")[1]).toContain(",Consultation,");
  });

  it("writes the human status label, not the raw enum", () => {
    const csv = buildSessionsCsv([booking({ status: ConsultationBookingStatus.NO_SHOW })], opts);
    expect(csv).toContain(",No-show,");
    expect(csv).not.toContain("NO_SHOW");
  });

  it("leaves a missing note blank rather than printing undefined", () => {
    const csv = buildSessionsCsv([booking({ notes: undefined })], opts);
    expect(csv.split("\n")[1].endsWith(",Completed,")).toBe(true);
    expect(csv).not.toContain("undefined");
  });

  it("escapes commas and quotes inside a note", () => {
    const csv = buildSessionsCsv([booking({ notes: 'Squats, then "AMRAP"' })], opts);
    expect(csv).toContain('"Squats, then ""AMRAP"""');
  });

  it("falls back to a short client id when no name is on the payload", () => {
    const csv = buildSessionsCsv(
      [booking({ clientFirstName: undefined, clientLastName: undefined })],
      opts,
    );
    expect(csv).toContain("Client 44EE55");
  });
});
