'use client';

import { useState, useEffect } from 'react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieSettings() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const consentGiven = localStorage.getItem('cookie-consent');
    if (consentGiven) {
      try {
        const savedPreferences = JSON.parse(consentGiven);
        setPreferences(savedPreferences);
      } catch (e) {
        console.error('Failed to parse cookie preferences', e);
      }
    }
  }, []);

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const acceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryOnly));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const cookieTypes = [
    {
      key: 'necessary' as const,
      title: 'Necessary Cookies',
      description: 'Essential for the website to function properly. These cookies enable core functionality such as security, network management, and accessibility. Cannot be disabled.',
      examples: 'Authentication, session management, security',
    },
    {
      key: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      examples: 'Google Analytics, page views, user behavior',
    },
    {
      key: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'Used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.',
      examples: 'Facebook Pixel, Google Ads, retargeting',
    },
  ];

  return (
    <div className="w-full">
      {/* Success Message */}
      {saved && (
        <div className="mb-6 rounded-lg border-2 border-accent-green-500 bg-accent-green-500 bg-opacity-10 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-accent-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-foreground">
              Cookie preferences saved successfully
            </p>
          </div>
        </div>
      )}

      {/* Cookie Types */}
      <div className="space-y-4 mb-6">
        {cookieTypes.map((cookie) => (
          <div
            key={cookie.key}
            className="rounded-lg border-2 border-neutral-300 bg-background p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {cookie.title}
                </h3>
                <p className="text-sm text-foreground-secondary mb-2">
                  {cookie.description}
                </p>
                <p className="text-xs text-foreground-secondary">
                  <strong>Examples:</strong> {cookie.examples}
                </p>
              </div>
              <button
                onClick={() => togglePreference(cookie.key)}
                disabled={cookie.key === 'necessary'}
                className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                  preferences[cookie.key]
                    ? 'bg-primary-500'
                    : 'bg-neutral-300'
                } ${cookie.key === 'necessary' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                aria-label={`Toggle ${cookie.title}`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    preferences[cookie.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {cookie.key === 'necessary' && (
              <p className="text-xs text-foreground-secondary italic">
                * Always active - required for basic site functionality
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={acceptNecessary}
          className="rounded-lg border-2 border-neutral-300 bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-neutral-100"
        >
          Accept Necessary Only
        </button>
        <button
          onClick={acceptAll}
          className="rounded-lg border-2 border-neutral-300 bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-neutral-100"
        >
          Accept All Cookies
        </button>
        <button
          onClick={savePreferences}
          className="rounded-lg bg-primary-500 px-6 py-3 font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
        >
          Save My Preferences
        </button>
      </div>
    </div>
  );
}
