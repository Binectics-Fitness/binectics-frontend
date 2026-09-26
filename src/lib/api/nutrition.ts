import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Provider nutrition library — personal food database + reusable
 * protocols. Everything is scoped to the authenticated provider; there
 * is no global catalog and no external nutrition-data source.
 */

export interface FoodItem {
  _id: string;
  created_by: string;
  name: string;
  category?: string;
  serving_label: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProtocolStep {
  title: string;
  detail?: string;
}

export interface Protocol {
  _id: string;
  created_by: string;
  name: string;
  description?: string;
  category?: string;
  duration_weeks?: number;
  steps: ProtocolStep[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodItemRequest {
  name: string;
  category?: string;
  servingLabel: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  notes?: string;
}

export type UpdateFoodItemRequest = Partial<CreateFoodItemRequest> & {
  isArchived?: boolean;
};

/** POST /nutrition/protocols/:id/convert - the draft program it became. */
export interface ProtocolConversion {
  template: { _id: string; name: string; status: "draft" | "published" | "archived" };
  /** False when the protocol had already been converted (same program). */
  created: boolean;
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface ListParams {
  search?: string;
  category?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

function listQuery(params?: ListParams): string {
  const search = new URLSearchParams();
  if (params?.search) search.set("search", params.search);
  if (params?.category) search.set("category", params.category);
  if (params?.includeArchived) search.set("includeArchived", "true");
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const nutritionService = {
  // ── Foods ────────────────────────────────────────────────────────

  listFoods(params?: ListParams): Promise<ApiResponse<PaginatedList<FoodItem>>> {
    return apiClient.get<PaginatedList<FoodItem>>(
      `/nutrition/foods${listQuery(params)}`,
    );
  },

  getFood(foodId: string): Promise<ApiResponse<FoodItem>> {
    return apiClient.get<FoodItem>(`/nutrition/foods/${foodId}`);
  },

  createFood(payload: CreateFoodItemRequest): Promise<ApiResponse<FoodItem>> {
    return apiClient.post<FoodItem>("/nutrition/foods", payload);
  },

  updateFood(
    foodId: string,
    payload: UpdateFoodItemRequest,
  ): Promise<ApiResponse<FoodItem>> {
    return apiClient.patch<FoodItem>(`/nutrition/foods/${foodId}`, payload);
  },

  archiveFood(foodId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/nutrition/foods/${foodId}`);
  },

  duplicateFood(foodId: string): Promise<ApiResponse<FoodItem>> {
    return apiClient.post<FoodItem>(`/nutrition/foods/${foodId}/duplicate`, {});
  },

  // ── Protocols ────────────────────────────────────────────────────

  listProtocols(
    params?: ListParams,
  ): Promise<ApiResponse<PaginatedList<Protocol>>> {
    return apiClient.get<PaginatedList<Protocol>>(
      `/nutrition/protocols${listQuery(params)}`,
    );
  },

  getProtocol(protocolId: string): Promise<ApiResponse<Protocol>> {
    return apiClient.get<Protocol>(`/nutrition/protocols/${protocolId}`);
  },

  /**
   * Turn a protocol into a draft Program (and archive the protocol). Safe to
   * repeat: converting again returns the same program.
   */
  convertProtocol(protocolId: string): Promise<ApiResponse<ProtocolConversion>> {
    return apiClient.post<ProtocolConversion>(
      `/nutrition/protocols/${protocolId}/convert`,
      {},
    );
  },

  archiveProtocol(protocolId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/nutrition/protocols/${protocolId}`);
  },
};
