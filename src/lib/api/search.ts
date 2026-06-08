import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export enum UnifiedSearchSection {
  MARKETPLACE = "marketplace",
  BOOKINGS = "bookings",
  TEAMS = "teams",
  PLANS = "plans",
}

export enum UnifiedSearchItemKind {
  LISTING = "listing",
  BOOKING = "booking",
  ORGANIZATION = "organization",
  PLAN = "plan",
}

export interface UnifiedSearchItem {
  id: string;
  title: string;
  subtitle?: string;
  kind: UnifiedSearchItemKind;
  action_url: string;
  metadata?: Record<string, unknown>;
}

export interface UnifiedSearchResult {
  query: string;
  sections: {
    [UnifiedSearchSection.MARKETPLACE]: UnifiedSearchItem[];
    [UnifiedSearchSection.BOOKINGS]: UnifiedSearchItem[];
    [UnifiedSearchSection.TEAMS]: UnifiedSearchItem[];
    [UnifiedSearchSection.PLANS]: UnifiedSearchItem[];
  };
  meta: {
    limitPerSection: number;
  };
}

export const searchService = {
  unifiedSearch(params: {
    q?: string;
    limit?: number;
  }): Promise<ApiResponse<UnifiedSearchResult>> {
    const search = new URLSearchParams();
    const normalizedQuery = params.q?.trim() ?? "";
    if (normalizedQuery.length >= 2) {
      search.set("q", normalizedQuery);
    }

    const hasNumericLimit =
      typeof params.limit === "number" && Number.isFinite(params.limit);
    if (hasNumericLimit) {
      const normalizedLimit = Math.max(1, Math.min(20, Math.floor(params.limit!)));
      search.set("limit", String(normalizedLimit));
    }

    const query = search.toString();

    return apiClient.get<UnifiedSearchResult>(
      `/search/unified${query ? `?${query}` : ""}`,
    );
  },
};
