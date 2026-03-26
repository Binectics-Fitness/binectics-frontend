"use client";

import { useState, useCallback } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        let message = "Unable to get your location";
        if (err.code === err.PERMISSION_DENIED) {
          message = "Location permission denied";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = "Location unavailable";
        } else if (err.code === err.TIMEOUT) {
          message = "Location request timed out";
        }
        setState((prev) => ({ ...prev, loading: false, error: message }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  const clearLocation = useCallback(() => {
    setState({ lat: null, lng: null, loading: false, error: null });
  }, []);

  return { ...state, requestLocation, clearLocation };
}
