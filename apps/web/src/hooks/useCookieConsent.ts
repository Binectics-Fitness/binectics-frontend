'use client';

import { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const consentGiven = localStorage.getItem('cookie-consent');
    if (consentGiven) {
      try {
        const savedPreferences = JSON.parse(consentGiven);
        setPreferences(savedPreferences);
        setHasConsent(true);
      } catch (e) {
        setHasConsent(false);
      }
    } else {
      setHasConsent(false);
    }
  }, []);

  const updatePreferences = (newPreferences: CookiePreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences));
    setHasConsent(true);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie-consent');
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setHasConsent(false);
  };

  return {
    preferences,
    hasConsent,
    updatePreferences,
    resetConsent,
  };
}
