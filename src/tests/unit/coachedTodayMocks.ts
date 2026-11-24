import { vi } from "vitest";
import { authService } from "@/lib/api/auth";
import { checklistService } from "@/lib/api/checklist";
import { consultationsService } from "@/lib/api/consultations";
import { fastingService } from "@/lib/api/fasting";
import { marketplaceService, type MyProviders } from "@/lib/api/marketplace";
import { myProgramsService, type AgendaTask } from "@/lib/api/myPrograms";
import { progressService } from "@/lib/api/progress";
import { starterService } from "@/lib/api/starter";
import { waterService } from "@/lib/api/water";

const ok = <T,>(data: T) => Promise.resolve({ success: true, data } as never);

/**
 * The reads the coached Today makes beyond the page's own snapshot: the
 * member's providers, pending requests, own tracking, privacy, the agenda and
 * session types. Every one answers, so a test sees the page as it is, not as
 * a failed read draws it. Override any with `over`.
 */
export function mockCoachedTodayReads(
  over: Partial<{
    providers: MyProviders;
    requests: unknown[];
    invitations: unknown[];
    fast: unknown;
    water: { glasses: number; target_glasses: number | null };
    list: { id: string; done: boolean }[];
    weightProfiles: unknown[];
    shareProgress: boolean;
    agenda: AgendaTask[];
    sessionTypes: unknown[];
  }> = {},
) {
  vi.spyOn(marketplaceService, "getMyProviders").mockReturnValue(ok(over.providers ?? { professionals: [], gyms: [] }));
  vi.spyOn(progressService, "getMyPendingClientRequests").mockReturnValue(ok(over.requests ?? []));
  vi.spyOn(progressService, "getMyReceivedInvitations").mockReturnValue(ok(over.invitations ?? []));
  vi.spyOn(fastingService, "current").mockReturnValue(ok(over.fast ?? null));
  vi.spyOn(waterService, "today").mockReturnValue(
    ok({ local_day: "2026-10-07", glass_ml: 250, ...(over.water ?? { glasses: 3, target_glasses: 8 }) }),
  );
  vi.spyOn(checklistService, "today").mockReturnValue(
    ok({
      local_day: "2026-10-07",
      items: (over.list ?? []).map((i) => ({ ...i, label: i.id, kind: "custom", system_key: null })),
    }),
  );
  vi.spyOn(progressService, "getMyOwnProfiles").mockReturnValue(ok(over.weightProfiles ?? []));
  vi.spyOn(authService, "getPrivacyPreferences").mockReturnValue(
    ok({ shareProgressWithProviders: over.shareProgress ?? true }),
  );
  vi.spyOn(myProgramsService, "agenda").mockReturnValue(ok(over.agenda ?? []));
  vi.spyOn(consultationsService, "getTypes").mockReturnValue(ok(over.sessionTypes ?? [{ _id: "t1" }]));
  vi.spyOn(starterService, "listMine").mockReturnValue(ok([]));
}
