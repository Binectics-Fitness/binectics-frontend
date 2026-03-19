"use client";

import { useState, useCallback } from "react";
import { authService } from "@/lib/api/auth";
import { utilityService } from "@/lib/api/utility";
import type { CountryItem } from "@/lib/api/utility";
import type { User } from "@/lib/types";

export function useProfileSettings() {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCountries = useCallback(async () => {
    setIsLoadingCountries(true);
    try {
      const response = await utilityService.getCountries();
      if (response.success && response.data) {
        setCountries(response.data);
      }
    } catch {
      // Non-critical: silently handle country loading failures
    } finally {
      setIsLoadingCountries(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Record<string, unknown>): Promise<User | null> => {
      setIsSaving(true);
      setError(null);
      try {
        const response = await authService.updateProfile(data);
        setIsSaving(false);
        if (response.success && response.data) {
          return response.data;
        }
        setError(response.message || "Failed to update profile");
        return null;
      } catch {
        setIsSaving(false);
        setError("An unexpected error occurred");
        return null;
      }
    },
    []
  );

  return {
    countries,
    isLoadingCountries,
    isSaving,
    error,
    loadCountries,
    updateProfile,
  };
}
