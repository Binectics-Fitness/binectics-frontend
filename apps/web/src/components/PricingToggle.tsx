'use client';

import { useState } from 'react';

interface PricingToggleProps {
  onChange: (isAnnual: boolean) => void;
}

export default function PricingToggle({ onChange }: PricingToggleProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const handleToggle = (value: boolean) => {
    setIsAnnual(value);
    onChange(value);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => handleToggle(false)}
        className={`text-base font-semibold transition-colors duration-200 ${
          !isAnnual ? 'text-foreground' : 'text-foreground-secondary'
        }`}
      >
        Monthly
      </button>

      <button
        onClick={() => handleToggle(!isAnnual)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
          isAnnual ? 'bg-primary-500' : 'bg-neutral-300'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
            isAnnual ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>

      <button
        onClick={() => handleToggle(true)}
        className={`text-base font-semibold transition-colors duration-200 ${
          isAnnual ? 'text-foreground' : 'text-foreground-secondary'
        }`}
      >
        Annual
      </button>

      {isAnnual && (
        <span className="ml-2 rounded-full bg-primary-500 px-3 py-1 text-sm font-semibold text-white">
          Save 20%
        </span>
      )}
    </div>
  );
}
