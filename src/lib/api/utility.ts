/**
 * Utility API Service
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export interface CityItem {
  name: string;
  stateCode: string;
}

export interface CountryItem {
  name: string;
  code: string;
  dialCode: string;
  cities: CityItem[];
}

class UtilityService {
  async getCountries(): Promise<ApiResponse<CountryItem[]>> {
    return await apiClient.get<CountryItem[]>("/utility/countries");
  }
}

export const utilityService = new UtilityService();
