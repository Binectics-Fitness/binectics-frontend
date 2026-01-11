'use client';

import React, { useState } from 'react';

export interface AccordionItemProps {
  title: string;
  content: string | React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, className = '' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-neutral-200 bg-background transition-all hover:border-neutral-300"
        >
          <button
            onClick={() => toggleItem(index)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-neutral-50"
            aria-expanded={openIndex === index}
          >
            <span className="font-medium text-foreground pr-4">{item.title}</span>
            <svg
              className={`h-5 w-5 flex-shrink-0 text-foreground-secondary transition-transform ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className={`transition-all duration-300 ease-in-out ${
              openIndex === index
                ? 'max-h-96 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="border-t border-neutral-200 px-6 py-4 text-sm text-foreground-secondary">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
