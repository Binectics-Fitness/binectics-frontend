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

export interface PlatformCurrency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export interface PlatformConfig {
  languages: string[];
  currencies: PlatformCurrency[];
  facility_suggestions: string[];
  amenity_suggestions: string[];
}

class UtilityService {
  async getCountries(): Promise<ApiResponse<CountryItem[]>> {
    return await apiClient.get<CountryItem[]>("/utility/countries");
  }

  async getPlatformConfig(): Promise<ApiResponse<PlatformConfig>> {
    return await apiClient.get<PlatformConfig>("/utility/platform-config");
  }
}

export const utilityService = new UtilityService();
