"use client";

import { useEffect, useRef, useState } from "react";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Gradient tint for the section background */
  gradient?: "green" | "blue" | "purple" | "warm" | "none";
  /** Whether children animate in on scroll */
  animate?: boolean;
  id?: string;
}

export function SectionWrapper({
  children,
  className = "",
  gradient = "none",
  animate = true,
  id,
}: SectionWrapperProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  const gradientMap = {
    none: "",
    green: "gradient-section-green",
    blue: "gradient-section-blue",
    purple: "gradient-section-purple",
    warm: "gradient-section-warm",
  };

  return (
    <section
      ref={ref}
      id={id}
      className={`${gradientMap[gradient]} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </section>
  );
}
