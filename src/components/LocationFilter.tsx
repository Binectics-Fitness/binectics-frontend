"use client";

import { useEffect, useRef } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

interface LocationFilterProps {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  onRadiusChange: (km: number) => void;
}

export default function LocationFilter({
  lat,
  lng,
  radiusKm,
  onLocationChange,
  onRadiusChange,
}: LocationFilterProps) {
  const geo = useGeolocation();
  const hasLocation = lat !== null && lng !== null;
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  const handleUseMyLocation = () => {
    if (geo.lat !== null && geo.lng !== null) {
      onLocationChange(geo.lat, geo.lng);
    } else {
      geo.requestLocation();
    }
  };

  // Sync geolocation result to parent when it arrives
  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null && !geo.loading) {
      onLocationChangeRef.current(geo.lat, geo.lng);
    }
  }, [geo.lat, geo.lng, geo.loading]);

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">
        Location
      </label>

      {hasLocation ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm">
            <svg
              className="h-4 w-4 text-primary-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            <span className="text-foreground font-medium">
              Using your location
            </span>
            <button
              onClick={() => {
                onLocationChange(null, null);
                geo.clearLocation();
              }}
              className="ml-auto text-foreground/60 hover:text-foreground"
              aria-label="Clear location"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div>
            <label className="text-xs text-foreground/60 mb-1 block">
              Radius: {radiusKm} km
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={radiusKm}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-foreground/40">
              <span>{RADIUS_OPTIONS[0]} km</span>
              <span>{RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1]} km</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={handleUseMyLocation}
            disabled={geo.loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary-500 transition-colors disabled:opacity-50"
          >
            {geo.loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Locating…
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
                Use my location
              </>
            )}
          </button>
          <p className="mt-1.5 text-xs text-foreground/40">
            Your location is used only to find nearby providers and is not
            stored.
          </p>
        </>
      )}

      {geo.error && <p className="mt-2 text-xs text-red-500">{geo.error}</p>}
    </div>
  );
}
