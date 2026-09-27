import { describe, it, expect, vi, afterEach } from "vitest";
import {
  bookingTypeName,
  consultationsService,
  type ConsultationType,
} from "@/lib/api/consultations";

const type = (id: string, name: string): ConsultationType =>
  ({ id, name, providerId: null } as unknown as ConsultationType);

describe("booking labels", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prefers the name the booking carries, then the lookup", () => {
    expect(
      bookingTypeName({ consultationTypeId: "t1", consultationTypeName: "Strength block" }, { t1: "Old" }),
    ).toBe("Strength block");
    expect(bookingTypeName({ consultationTypeId: "t1", consultationTypeName: null }, { t1: "Old" })).toBe("Old");
    expect(bookingTypeName({ consultationTypeId: "t9" }, {})).toBeUndefined();
  });

  it("merges the provider's own sessions over the platform defaults", async () => {
    vi.spyOn(consultationsService, "getOwnTypes").mockResolvedValue({
      success: true,
      data: [type("mine", "1:1 session"), type("shared", "Renamed by me")],
    });
    vi.spyOn(consultationsService, "getTypes").mockResolvedValue({
      success: true,
      data: [type("platform", "Intro call"), type("shared", "Platform name")],
    });

    const res = await consultationsService.getProviderTypeNames();

    expect(res.data).toEqual({ platform: "Intro call", mine: "1:1 session", shared: "Renamed by me" });
  });

  it("still labels with what loaded when one half fails", async () => {
    vi.spyOn(consultationsService, "getOwnTypes").mockResolvedValue({ success: false, message: "boom" });
    vi.spyOn(consultationsService, "getTypes").mockResolvedValue({
      success: true,
      data: [type("platform", "Intro call")],
    });

    const res = await consultationsService.getProviderTypeNames();
    expect(res).toEqual({ success: true, data: { platform: "Intro call" } });
  });
});
