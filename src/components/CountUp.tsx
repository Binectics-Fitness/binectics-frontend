"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** The display string, e.g. "14,200+" or "$2.1M" or "4.82" */
  value: string;
  /** Duration in ms */
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

function parseNumeric(value: string): { prefix: string; number: number; suffix: string; decimals: number } {
  const match = value.match(/^([^0-9]*)([0-9][0-9,.]*?)([^0-9,.]*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value, decimals: 0 };

  const prefix = match[1];
  const raw = match[2];
  const suffix = match[3];
  const cleaned = raw.replace(/,/g, "");
  const number = parseFloat(cleaned);
  const dotIndex = cleaned.indexOf(".");
  const decimals = dotIndex >= 0 ? cleaned.length - dotIndex - 1 : 0;

  return { prefix, number, suffix, decimals };
}

function formatNumber(n: number, decimals: number, useCommas: boolean): string {
  const fixed = n.toFixed(decimals);
  if (!useCommas) return fixed;
  const [int, dec] = fixed.split(".");
  const commaInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${commaInt}.${dec}` : commaInt;
}

export default function CountUp({ value, duration: durationProp, className, style }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const hasAnimated = useRef(false);

  const { prefix, number, suffix, decimals } = parseNumeric(value);
  const useCommas = value.includes(",");
  const duration = durationProp ?? (number < 10 ? 400 : number < 100 ? 700 : 1200);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setDisplay(`${prefix}0${suffix}`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = number * eased;
            setDisplay(`${prefix}${formatNumber(current, decimals, useCommas)}${suffix}`);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefix, number, suffix, decimals, useCommas, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}
