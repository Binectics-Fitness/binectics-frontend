"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface FaqItem {
  q: string;
  a: string;
}

function Item({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0);

  useEffect(() => {
    if (!bodyRef.current) return;
    setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
  }, [isOpen]);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-5 sm:px-7 py-4 sm:py-5.5 cursor-pointer flex justify-between items-center text-[15px] sm:text-[17px] font-medium text-ink text-left"
        style={{ letterSpacing: "-0.015em" }}
        aria-expanded={isOpen}
      >
        {item.q}
        <span
          className="font-mono text-fg-3 text-[22px] font-light ml-4 shrink-0 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        style={{ height: height ?? "auto", overflow: "hidden" }}
        className="transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div ref={bodyRef}>
          <div className="px-5 sm:px-7 pb-5 sm:pb-6 text-fg-2 text-[14px] sm:text-[15px] leading-relaxed max-w-[720px]">
            {item.a}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = useCallback((i: number) => {
    setOpenIndex((prev) => (prev === i ? -1 : i));
  }, []);

  return (
    <>
      {items.map((item, i) => (
        <Item key={i} item={item} isOpen={openIndex === i} onToggle={() => toggle(i)} />
      ))}
    </>
  );
}
