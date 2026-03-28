'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface AccordionItemProps {
  title: string;
  content: string | React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  className?: string;
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItemProps;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition-all duration-300 ${
        isOpen
          ? 'border-primary-500/30 shadow-[var(--shadow-card)]'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-neutral-50"
        aria-expanded={isOpen}
      >
        <span className={`font-medium pr-4 transition-colors duration-200 ${isOpen ? 'text-foreground' : 'text-foreground'}`}>
          {item.title}
        </span>
        <div
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            isOpen
              ? 'bg-primary-500/10 text-primary-600 rotate-180'
              : 'bg-neutral-100 text-foreground-secondary'
          }`}
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      <div
        style={{ height }}
        className="transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div ref={contentRef}>
          <div className="border-t border-neutral-100 px-6 py-4 text-sm leading-relaxed text-foreground-secondary">
            {item.content}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Accordion: React.FC<AccordionProps> = ({ items, className = '' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          item={item}
          isOpen={openIndex === index}
          onToggle={() => toggleItem(index)}
        />
      ))}
    </div>
  );
};
