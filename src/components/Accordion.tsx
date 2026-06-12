"use client";

import React, { useState, useRef, useEffect } from "react";

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
      className={`overflow-hidden rounded-(--r-3) border bg-bg transition-all duration-300 ${
        isOpen
          ? "border-signal/30 shadow-(--shadow-card)"
          : "border-border hover:border-border-2"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-bg-2"
        aria-expanded={isOpen}
      >
        <span
          className={`font-medium pr-4 transition-colors duration-200 ${isOpen ? "text-fg" : "text-fg"}`}
        >
          {item.title}
        </span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            isOpen
              ? "bg-signal/10 text-signal rotate-180"
              : "bg-bg-2 text-fg-2"
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
          <div className="border-t border-border px-6 py-4 text-sm leading-relaxed text-fg-2">
            {item.content}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  className = "",
}) => {
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
