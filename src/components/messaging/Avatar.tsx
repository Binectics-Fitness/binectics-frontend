"use client";

import { useState } from "react";
import { initials } from "./format";

/** A person's or gym's picture, falling back to initials (decorative: the name is always beside it). */
export function Avatar({
  name,
  url,
  size = 36,
  square = false,
}: {
  name: string;
  url: string | null | undefined;
  size?: number;
  square?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const radius = square ? "var(--r-2)" : "var(--r-full)";
  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote avatars from the API's CDN
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className="shrink-0 object-cover"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center text-[12px] font-semibold"
      style={{ width: size, height: size, borderRadius: radius, background: "var(--bg-3)", color: "var(--fg-2)" }}
    >
      {initials(name)}
    </span>
  );
}
