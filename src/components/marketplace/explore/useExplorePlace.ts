"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { PickedCity } from "@/lib/marketplace/exploreFilters";
import {
  geolocationPermission,
  requestBrowserPosition,
  resolveExplorePlace,
  resolveProfileCity,
  type GeoFailure,
  type ResolvedPlace,
} from "@/lib/marketplace/explorePlace";

export type GeoStatus = "idle" | "asking" | "granted" | GeoFailure;

/**
 * Explore's place (lib/marketplace/explorePlace.ts). The browser prompt only
 * ever follows a tap (`ask`); on load the position is read silently only
 * when the browser already allows it.
 */
export function useExplorePlace(picked: PickedCity | null) {
  const { user, isLoading: authLoading } = useAuth();
  const profileCity = user?.city?.trim() || null;
  const profileCountry = user?.country_code?.trim().toUpperCase() || null;

  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [geo, setGeo] = useState<GeoStatus>("idle");
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [resolved, setResolved] = useState<{ key: string; point: { lat: number; lng: number } | null } | null>(null);

  // Already allowed (an earlier visit): use it without asking again.
  useEffect(() => {
    let live = true;
    void geolocationPermission().then(async (state) => {
      if (!live) return;
      if (state === "granted") {
        const res = await requestBrowserPosition();
        if (!live) return;
        if (res.ok) {
          setGps({ lat: res.lat, lng: res.lng });
          setGeo("granted");
        }
      }
      if (live) setPermissionChecked(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const profileKey = profileCity ? `${profileCity}|${profileCountry ?? ""}` : null;
  useEffect(() => {
    if (!profileCity || !profileKey) return;
    let live = true;
    void resolveProfileCity(profileCity, profileCountry).then((c) => {
      if (live) setResolved({ key: profileKey, point: c ? { lat: c.lat, lng: c.lng } : null });
    });
    return () => {
      live = false;
    };
  }, [profileCity, profileCountry, profileKey]);

  const ask = useCallback(async (): Promise<boolean> => {
    setGeo("asking");
    const res = await requestBrowserPosition();
    if (res.ok) {
      setGps({ lat: res.lat, lng: res.lng });
      setGeo("granted");
      return true;
    }
    setGps(null);
    setGeo(res.reason);
    return false;
  }, []);

  const profilePoint = resolved && resolved.key === profileKey ? resolved.point : null;
  const profilePending = !!profileKey && (!resolved || resolved.key !== profileKey);

  const current: ResolvedPlace = resolveExplorePlace({
    picked,
    gps,
    profileCity,
    profileCountry,
    profilePoint,
  });
  // Where "Near me" points, whatever city is picked.
  const near: ResolvedPlace = resolveExplorePlace({ picked: null, gps, profileCity, profileCountry, profilePoint });

  return {
    ...current,
    near,
    geo,
    ask,
    /**
     * False until auth, the permission read and the profile-city lookup have
     * answered, so the list loads once, not by text and then by point.
     */
    ready: !!picked || (!authLoading && permissionChecked && !profilePending),
  };
}
