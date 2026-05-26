"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before this element begins its transition */
  delay?: number;
  /** Override default 'up' direction */
  direction?: "up" | "left" | "right";
  /** For staggering children: pass true and each direct child gets a sequential delay */
  stagger?: boolean;
  /** Base delay between staggered children in ms */
  staggerInterval?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  stagger = false,
  staggerInterval = 60,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const translate =
      direction === "left" ? "translateX(-20px)" :
      direction === "right" ? "translateX(20px)" :
      "translateY(20px)";

    if (stagger) {
      const kids = Array.from(el.children) as HTMLElement[];
      kids.forEach((child, i) => {
        child.style.opacity = "0";
        child.style.transform = translate;
        child.style.transition = `opacity 0.5s ease, transform 0.5s ease`;
        child.style.transitionDelay = `${delay + i * staggerInterval}ms`;
      });
    } else {
      el.style.opacity = "0";
      el.style.transform = translate;
      el.style.transition = `opacity 0.55s ease, transform 0.55s ease`;
      el.style.transitionDelay = `${delay}ms`;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (stagger) {
            const kids = Array.from(el.children) as HTMLElement[];
            kids.forEach((child) => {
              child.style.opacity = "1";
              child.style.transform = "none";
            });
          } else {
            el.style.opacity = "1";
            el.style.transform = "none";
          }
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, direction, stagger, staggerInterval]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
